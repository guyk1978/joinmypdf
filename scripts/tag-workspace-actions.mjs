import fs from "node:fs";
import path from "node:path";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith("Workspace.tsx")) out.push(full);
  }
  return out;
}

let n = 0;
for (const file of walk("src/components")) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes("useWorkspaceProjectBridge") || s.includes("data-workspace-actions")) continue;
  const next = s.replace(
    'className="flex flex-wrap gap-3"',
    'className="flex flex-wrap gap-3" data-workspace-actions=""',
  );
  if (next !== s) {
    fs.writeFileSync(file, next);
    n += 1;
    console.log(file);
  }
}
console.log("tagged", n);
