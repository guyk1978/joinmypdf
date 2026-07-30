/**
 * Ensure files that call useWorkspaceProjectBridge also import it.
 */
import fs from "node:fs";
import path from "node:path";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const IMPORT =
  'import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";';

let n = 0;
for (const file of walk("src/components")) {
  // Never self-import the registry module.
  if (file.endsWith(`${path.sep}WorkspaceProjectRegistry.tsx`)) continue;

  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("useWorkspaceProjectBridge(")) continue;
  if (src.includes("WorkspaceProjectRegistry")) continue;

  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  const importLine = IMPORT + nl;

  if (/^"use client";/.test(src)) {
    src = src.replace(/^"use client";\r?\n/, `"use client";${nl}${nl}${importLine}`);
  } else {
    src = importLine + src;
  }

  fs.writeFileSync(file, src);
  n += 1;
  console.log(file);
}
console.log("added imports", n);
