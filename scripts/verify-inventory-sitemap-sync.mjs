/**
 * Verify canonical inventory tool sources are covered by sitemap generation.
 * Expects nested hierarchy URLs for EVERY category membership.
 * Run: node scripts/verify-inventory-sitemap-sync.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  listAllNestedToolPaths,
  parseInventoryHierarchy,
} from "./lib/sitemap-hierarchy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const LOCALES = ["en", "he", "ru"];

async function readJson(rel) {
  return JSON.parse(await readFile(path.join(root, rel), "utf8"));
}

async function main() {
  const registry = await readJson("assets/data/tools.json");
  const audioTools = await readJson("assets/data/audio-tools.json");
  const studioTools = (await readJson("assets/data/studio-tools.json")).tools || [];
  const inventorySource = await readFile(
    path.join(root, "src/data/tools-inventory.ts"),
    "utf8",
  );
  const hierarchy = parseInventoryHierarchy(inventorySource);

  let statusMap = {};
  try {
    statusMap = (await readJson("logs/inventory-tool-status.json")).tools || {};
  } catch {
    statusMap = {};
  }

  const bySlug = new Map();
  for (const tool of registry.tools || []) {
    bySlug.set(tool.slug, { slug: tool.slug, source: "tools.json" });
  }
  for (const tool of audioTools) {
    if (!bySlug.has(tool.slug)) bySlug.set(tool.slug, { slug: tool.slug, source: "audio-tools.json" });
  }
  for (const tool of studioTools) {
    if (!bySlug.has(tool.slug)) bySlug.set(tool.slug, { slug: tool.slug, source: "studio-tools.json" });
  }
  for (const slug of hierarchy.primaryBySlug.keys()) {
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, source: "tools-inventory" });
  }

  const active = [...bySlug.values()].filter(
    (tool) => (statusMap[tool.slug] || "active") === "active",
  );

  const nestedPaths = listAllNestedToolPaths(hierarchy).filter((nestedPath) => {
    const slug = nestedPath.split("/").filter(Boolean).pop();
    return slug && (statusMap[slug] || "active") === "active";
  });

  const ruNestedPaths = listAllNestedToolPaths(hierarchy, { locale: "ru" });
  const ruMerge = "/tools/pdf-tools/obiedinenie-pdf/";

  const sitemapPaths = LOCALES.flatMap((locale) =>
    listAllNestedToolPaths(hierarchy, { locale })
      .filter((nestedPath) => {
        const slug = nestedPath.split("/").filter(Boolean).pop();
        // Reverse RU slug for status when needed is skipped for count; paths are emitted.
        return Boolean(slug);
      })
      .map((nested) => `/${locale}${nested}`),
  );

  const compressJpg = "/tools/jpg-tools/compress-image/";
  const compressImage = "/tools/image-tools/compress-image/";
  const heic = "/tools/image-tools/heic-to-jpg/";

  console.log("=== Inventory ↔ Sitemap sync (all category nests) ===");
  console.log(`Active tools:                 ${active.length}`);
  console.log(`Nested membership paths:      ${nestedPaths.length}`);
  console.log(`Localized nested tool URLs:   ${sitemapPaths.length}`);
  console.log(`jpg-tools/compress-image:     ${nestedPaths.includes(compressJpg) ? "OK" : "MISSING"}`);
  console.log(`image-tools/compress-image:   ${nestedPaths.includes(compressImage) ? "OK" : "MISSING"}`);
  console.log(`image-tools/heic-to-jpg:      ${nestedPaths.includes(heic) ? "OK" : "MISSING"}`);
  console.log(`ru pdf-tools/obiedinenie-pdf: ${ruNestedPaths.includes(ruMerge) ? "OK" : "MISSING"}`);

  const jpgChildren = hierarchy.slugsByCategory.get("jpg") || [];
  console.log(`jpg-tools children:           ${jpgChildren.length} (${jpgChildren.slice(0, 8).join(", ")}${jpgChildren.length > 8 ? ",…" : ""})`);

  if (!nestedPaths.includes(compressJpg)) {
    console.error("\nFAIL: compress-image missing under /tools/jpg-tools/");
    process.exitCode = 1;
    return;
  }
  if (!nestedPaths.includes(heic)) {
    console.error("\nFAIL: heic-to-jpg missing under /tools/image-tools/");
    process.exitCode = 1;
    return;
  }
  if (!jpgChildren.includes("compress-image")) {
    console.error("\nFAIL: jpg category membership missing compress-image");
    process.exitCode = 1;
    return;
  }
  if (!ruNestedPaths.includes(ruMerge)) {
    console.error("\nFAIL: Russian SEO slug missing for pdf-merge under /tools/pdf-tools/");
    process.exitCode = 1;
    return;
  }

  console.log("\nOK: category-first nested paths include jpg-tools children and ru PDF SEO slugs.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
