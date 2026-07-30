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

const re =
  /^import \{ useWorkspaceProjectBridge \} from "@\/components\/WorkspaceProjectRegistry";\r?\n"use client";\r?\n/;

let n = 0;
for (const file of walk("src/components")) {
  let src = fs.readFileSync(file, "utf8");
  if (!re.test(src)) continue;
  src = src.replace(
    re,
    '"use client";\n\nimport { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";\n',
  );
  fs.writeFileSync(file, src);
  n += 1;
  console.log(file);
}
console.log("fixed", n);
