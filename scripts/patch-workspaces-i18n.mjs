#!/usr/bin/env node
/** Patches *Workspace.tsx files with useWorkspaceI18n + operation prop on FileUploadZone. */
import fs from "node:fs";
import path from "node:path";

const componentsDir = path.join(process.cwd(), "src", "components");
const skip = new Set(["ToolWorkspace.tsx", "MergePdfWorkspace.tsx", "ConvertToolWorkspace.tsx"]);

const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith("Workspace.tsx") && !skip.has(f));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let src = fs.readFileSync(filePath, "utf8");
  if (src.includes("useWorkspaceI18n")) {
    console.log(`skip (already patched): ${file}`);
    continue;
  }

  if (!src.includes('"use client"')) continue;

  if (!src.includes("useWorkspaceI18n")) {
    const importAnchor = src.includes('from "@/components/FileUploadZone"')
      ? 'from "@/components/FileUploadZone"'
      : src.includes("FileUploadZone")
        ? '"use client";'
        : null;
    if (importAnchor === 'from "@/components/FileUploadZone"') {
      src = src.replace(
        'from "@/components/FileUploadZone"',
        'from "@/components/FileUploadZone"\nimport { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";',
      );
    } else if (src.includes("FileUploadZone")) {
      src = src.replace(
        '"use client";\n',
        '"use client";\n\nimport { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";\n',
      );
    }
  }

  const fnMatch = src.match(/export function (\w+)\(\{ tool, slug \}/);
  if (fnMatch && !src.includes("const ws = useWorkspaceI18n")) {
    src = src.replace(
      /export function (\w+)\(\{ tool, slug \}[^)]*\) \{/,
      (m) => `${m}\n  const ws = useWorkspaceI18n(tool.operation);`,
    );
  }

  src = src.replace(/secondaryLabel="Home"/g, "secondaryLabel={ws.home}");

  src = src.replace(
    /(\s+)title="Drop a PDF here or click to browse"\n\s+description="[^"]*"/g,
    "$1operation={tool.operation}",
  );

  src = src.replace(
    /(\s+)title="Drop a password-protected PDF here or click to browse"\n\s+description="[^"]*"/g,
    '$1operation={tool.operation}',
  );

  src = src.replace(/>\s*Clear\s*<\/button>/g, ">{ws.clear}</button>");

  src = src.replace(/setStatus\("Choose a valid PDF file\."\)/g, 'setStatus(ws.status("chooseValidPdf"))');

  fs.writeFileSync(filePath, src);
  console.log(`patched: ${file}`);
}

console.log("Done.");
