/**
 * Inject useWorkspaceProjectBridge into image/favicon tools that use sourceFile.
 * Run: node scripts/inject-sourcefile-project-bridge.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/components");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function ensureImport(src) {
  if (src.includes("useWorkspaceProjectBridge")) return src;
  const line =
    'import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";\n';
  if (src.includes('"use client";\n')) {
    return src.replace('"use client";\n', `"use client";\n\n${line}`);
  }
  return line + src;
}

function ensureUseCallback(src) {
  if (/import\s*\{[^}]*\buseCallback\b/.test(src)) return src;
  return src.replace(/import\s*\{([^}]+)\}\s*from "react"/, (m, inner) => {
    if (/\buseCallback\b/.test(inner)) return m;
    return `import { ${inner.trim().replace(/,\s*$/, "")}, useCallback } from "react"`;
  });
}

const report = [];
let changed = 0;

for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");
  if (!/const \[sourceFile,\s*setSourceFile\]/.test(src)) continue;
  if (src.includes("useWorkspaceProjectBridge") || src.includes("SaveProjectButton")) continue;
  if (!/\bbusy\b/.test(src)) continue;

  const hasLoadFile = /\bconst loadFile\s*=/.test(src);
  const loadLine = hasLoadFile ? "void loadFile(next);" : "setSourceFile(next);";

  const block = `
  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    ${loadLine}
  }, [${hasLoadFile ? "loadFile" : ""}]);

  useWorkspaceProjectBridge({
    files: sourceFile ? [sourceFile] : [],
    disabled: !sourceFile || busy,
    onRestore: onRestoreProject,
  });
`;

  let next = ensureImport(src);
  next = ensureUseCallback(next);

  // Insert before return that contains crop-image or main tool root
  const markers = [
    /\n  return \(\s*\n\s*<div className=\{clsx\(/,
    /\n  return \(\s*\n\s*<div className="crop-image/,
    /\n  return \(\s*\n\s*<div className=\{/,
    /\n  return \(/,
  ];
  let inserted = false;
  for (const re of markers) {
    const m = next.match(re);
    if (m && m.index != null) {
      // Only first return in component-ish area
      next = `${next.slice(0, m.index)}\n${block}${next.slice(m.index)}`;
      inserted = true;
      break;
    }
  }
  if (!inserted || !next.includes("useWorkspaceProjectBridge(")) {
    report.push(`FAIL ${path.relative(process.cwd(), file)}`);
    continue;
  }

  next = next.replace(
    'className="crop-image-tool__actions"',
    'className="crop-image-tool__actions" data-workspace-actions=""',
  );

  fs.writeFileSync(file, next);
  changed += 1;
  report.push(`OK ${path.relative(process.cwd(), file)}`);
}

console.log(report.join("\n"));
console.log(`\nChanged: ${changed}`);
