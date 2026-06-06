import fs from "fs";
import { globSync } from "fs";

const files = globSync("src/components/**/*Workspace*.tsx");
let count = 0;

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  s = s.replace(
    /<WorkspaceUploadShell[^>]*>\s*\n/g,
    "<WorkspaceUploadShell>\n      ",
  );

  if (s !== orig) {
    fs.writeFileSync(file, s);
    count += 1;
    console.log("updated", file);
  }
}

console.log("total", count);
