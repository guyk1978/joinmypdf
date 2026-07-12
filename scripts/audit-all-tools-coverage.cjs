/**
 * Verify All Tools modal coverage after inventory sync.
 * Run: node scripts/audit-all-tools-coverage.cjs
 */
const fs = require("fs");
const path = require("path");

const inventorySrc = fs.readFileSync(path.join(__dirname, "../src/data/tools-inventory.ts"), "utf8");
const inventoryIds = [...inventorySrc.matchAll(/^\s+id: "([^"]+)",$/gm)].map((m) => m[1]);

const toolsSrc = fs.readFileSync(path.join(__dirname, "../src/config/tools.ts"), "utf8");
const slugBlocks = [...toolsSrc.matchAll(/slugs:\s*(?:columnSlugs\(\s*)?\[([\s\S]*?)\]/g)];
const curated = new Set();
for (const block of slugBlocks) {
  for (const m of block[1].matchAll(/"([a-z0-9-]+)"/g)) curated.add(m[1]);
}

const syncSrc = fs.readFileSync(path.join(__dirname, "../src/lib/tool-registry.ts"), "utf8");
const hasSync = syncSrc.includes("listInventorySlugsForModal");

console.log("inventory", inventoryIds.length);
console.log("curated registry slugs", curated.size);
console.log("inventory sync wired", hasSync);
const wouldAppend = inventoryIds.filter((id) => !curated.has(id));
console.log("appended via inventory sync", wouldAppend.length);
console.log("sample appended:", wouldAppend.slice(0, 15).join(", "));
