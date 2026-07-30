/**
 * Inject useWorkspaceProjectBridge into file-based workspaces.
 * Run: node scripts/inject-workspace-project-bridge.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/components");

const SKIP = new Set([
  "ConvertToolWorkspace.tsx",
  "ToolWorkspace.tsx",
  "MergePdfWorkspace.tsx",
  "WorkspaceProjectControls.tsx",
  "WorkspaceProjectRegistry.tsx",
  "WorkspaceActionRow.tsx",
  "TextWorkspace.tsx",
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith("Workspace.tsx")) out.push(full);
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

function buildBridgeBlock(mode, src) {
  const hasPickFile = /\bconst pickFile\s*=/.test(src) || /\bpickFile\s*=\s*async/.test(src);
  const hasAddFile = /\bconst addFile\s*=/.test(src);
  const hasAddRaw = /\bconst addRaw\s*=/.test(src);

  if (mode === "files") {
    return `
  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    if (payload.files.length) setFiles(payload.files);
  }, []);

  useWorkspaceProjectBridge({
    files,
    disabled: files.length === 0 || busy,
    onRestore: onRestoreProject,
  });
`;
  }

  let loadLine = "setFile(next);";
  if (hasPickFile) loadLine = "void pickFile(next);";
  else if (hasAddFile) loadLine = "addFile([next]);";
  else if (hasAddRaw) loadLine = "addRaw([next]);";

  return `
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
}

function injectBeforeReturn(src, block) {
  if (src.includes("useWorkspaceProjectBridge(")) return src;

  // Insert before the last `return (` that looks like the component JSX return
  // Prefer: the return that contains `id="tool-workspace"` or `tool-workspace`
  const patterns = [
    /\n  return \(\s*\n\s*<div id="tool-workspace"/,
    /\n  return \(\s*\n\s*<div\s*\n\s*id="tool-workspace"/,
    /\n  return \(\s*\n\s*<WorkspaceUploadShell/,
    /\n  return \(\s*\n\s*<div id=\{/,
  ];

  for (const re of patterns) {
    const m = src.match(re);
    if (m && m.index != null) {
      return `${src.slice(0, m.index)}\n${block}${src.slice(m.index)}`;
    }
  }

  // Fallback: first `return (` after export function
  const exportIdx = src.search(/export function \w+/);
  if (exportIdx < 0) return src;
  const after = src.slice(exportIdx);
  const retRel = after.search(/\n  return \(/);
  if (retRel < 0) return src;
  const abs = exportIdx + retRel;
  return `${src.slice(0, abs)}\n${block}${src.slice(abs)}`;
}

const report = [];
let changed = 0;

for (const file of walk(ROOT)) {
  const base = path.basename(file);
  if (SKIP.has(base)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (
    src.includes("SaveProjectButton") ||
    src.includes("useWorkspaceProjectBridge") ||
    src.includes("WorkspaceActionRow") ||
    src.includes("WorkspaceProjectControls")
  ) {
    continue;
  }
  if (!/tool:\s*ToolDefinition/.test(src)) continue;

  const mode = /const \[files,\s*setFiles\]/.test(src)
    ? "files"
    : /const \[file,\s*setFile\]/.test(src)
      ? "file"
      : null;
  if (!mode) {
    report.push(`SKIP ${path.relative(process.cwd(), file)}`);
    continue;
  }
  if (!/\bbusy\b/.test(src)) {
    report.push(`NOBUSY ${path.relative(process.cwd(), file)}`);
    continue;
  }

  const before = src;
  src = ensureImport(src);
  src = ensureUseCallback(src);
  src = injectBeforeReturn(src, buildBridgeBlock(mode, before));
  if (src === before || !src.includes("useWorkspaceProjectBridge(")) {
    report.push(`FAIL ${path.relative(process.cwd(), file)}`);
    continue;
  }
  fs.writeFileSync(file, src);
  changed += 1;
  report.push(`OK(${mode}) ${path.relative(process.cwd(), file)}`);
}

console.log(report.join("\n"));
console.log(`\nChanged: ${changed}`);
