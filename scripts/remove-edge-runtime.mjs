import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src/app");
const skip = "src/app/api/contact/route.ts";

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(tsx?)$/.test(ent.name)) {
      const rel = path.relative(process.cwd(), p).replace(/\\/g, "/");
      if (rel.replace(/\\/g, "/") === skip) continue;
      let c = fs.readFileSync(p, "utf8");
      if (!c.includes('export const runtime = "edge";')) continue;
      const n = c.replace(/export const runtime = "edge";\r?\n/g, "");
      if (n !== c) {
        fs.writeFileSync(p, n);
        console.log("Updated:", rel);
      }
    }
  }
}

walk(root);
