/**
 * Audit: every tools-inventory id should have a RU SEO slug alias.
 * Usage: node scripts/audit-ru-slugs.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const inv = fs.readFileSync(path.join(root, "src/data/tools-inventory.ts"), "utf8");
const ids = [...inv.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const slugsFile = fs.readFileSync(path.join(root, "src/lib/locale-tool-slugs.ts"), "utf8");
const keySet = new Set();
for (const m of slugsFile.matchAll(/^\s*"([a-z0-9-]+)":\s*"[a-z0-9-]+"/gm)) {
  keySet.add(m[1]);
}
const missing = ids.filter((id) => !keySet.has(id));
console.log(`inventory=${ids.length} ruMapped=${keySet.size} missing=${missing.length}`);
if (missing.length) {
  console.log(missing.join("\n"));
  process.exitCode = 1;
} else {
  console.log("OK: all inventory tools have RU SEO slug aliases.");
}
