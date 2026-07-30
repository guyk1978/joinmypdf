/**
 * Inject project bridge into media tools with `const [file, setFile]`.
 * Run: node scripts/inject-media-project-bridge.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = [
  path.resolve("src/components/tools"),
  path.resolve("src/components"),
];

const SKIP = new Set([
  "WorkspaceProjectRegistry.tsx",
  "WorkspaceProjectControls.tsx",
  "ConvertToolWorkspace.tsx",
  "ToolWorkspace.tsx",
  "MergePdfWorkspace.tsx",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, out);
    } else if (entry.name.endsWith(".tsx")) out.push(full);
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
const seen = new Set();

for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (seen.has(file)) continue;
    seen.add(file);
    const base = path.basename(file);
    if (SKIP.has(base) || base.endsWith("Workspace.tsx")) continue; // workspaces already handled
    let src = fs.readFileSync(file, "utf8");
    if (!/const \[file,\s*setFile\]/.test(src)) continue;
    if (
      src.includes("useWorkspaceProjectBridge") ||
      src.includes("SaveProjectButton") ||
      src.includes("WorkspaceActionRow")
    ) {
      continue;
    }
    if (!/\bbusy\b/.test(src)) continue;

    const hasLoad =
      /\bconst loadFile\s*=/.test(src) ||
      /\bconst onFile\s*=/.test(src) ||
      /\bconst handleFile\s*=/.test(src);

    let loadLine = "setFile(next);";
    if (/\bconst loadFile\s*=/.test(src)) loadLine = "void loadFile(next);";
    else if (/\bconst handleFiles\s*=/.test(src)) loadLine = "handleFiles([next]);";
    else if (/\bconst onPick\s*=/.test(src)) loadLine = "onPick(next);";

    const block = `
  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    ${loadLine}
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });
`;

    let nextSrc = ensureImport(src);
    nextSrc = ensureUseCallback(nextSrc);
    const ret = nextSrc.search(/\n  return \(/);
    if (ret < 0) {
      report.push(`FAIL ${path.relative(process.cwd(), file)}`);
      continue;
    }
    nextSrc = `${nextSrc.slice(0, ret)}\n${block}${nextSrc.slice(ret)}`;
    nextSrc = nextSrc.replace(
      /className="([^"]*actions[^"]*)"/,
      'className="$1" data-workspace-actions=""',
    );
    fs.writeFileSync(file, nextSrc);
    changed += 1;
    report.push(`OK ${path.relative(process.cwd(), file)}`);
  }
}

console.log(report.join("\n"));
console.log(`\nChanged: ${changed}`);
