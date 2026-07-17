/**
 * Verify canonical inventory tool sources are covered by sitemap generation.
 * Expects nested hierarchy URLs: /{locale}/tools/{hub}/{slug}/
 * Run: node scripts/verify-inventory-sitemap-sync.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseInventoryPrimaryCategories,
  resolveNestedToolPath,
} from "./lib/sitemap-hierarchy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const LOCALES = ["en", "he"];

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
  const primaryBySlug = parseInventoryPrimaryCategories(inventorySource);

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
  for (const slug of primaryBySlug.keys()) {
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, source: "tools-inventory" });
  }

  const all = [...bySlug.values()];
  const active = all.filter((tool) => (statusMap[tool.slug] || "active") === "active");
  const inactive = all.filter((tool) => (statusMap[tool.slug] || "active") === "inactive");

  const sitemapPaths = active.flatMap((tool) => {
    const nested = resolveNestedToolPath(tool.slug, primaryBySlug);
    return LOCALES.map((locale) => `/${locale}${nested}`);
  });

  const heicSample = resolveNestedToolPath("heic-to-jpg", primaryBySlug);
  const heicOk = heicSample === "/tools/image-tools/heic-to-jpg/";

  const requiredExtras = [
    "timeline-gantt-generator",
    "mp3-converter",
    "audio-normalizer",
    "invoice-generator",
    "pdf-a-converter",
    "pdf-metadata-editor",
    "pdf-linearization",
    "n-up-pdf",
    "grayscale-pdf",
    "pdf-to-html",
    "pdf-signature-validator",
    "pdf-to-epub",
    "pdf-to-xps",
    "extract-tables-pdf",
    "heic-to-jpg",
  ];
  const missingRequired = requiredExtras.filter((slug) => !bySlug.has(slug));

  console.log("=== Inventory ↔ Sitemap sync (nested hierarchy) ===");
  console.log(`Canonical tools (JSON + inventory): ${all.length}`);
  console.log(`  from tools.json:            ${(registry.tools || []).length}`);
  console.log(`  audio appended:             ${audioTools.length}`);
  console.log(`  studio tools file:          ${studioTools.length}`);
  console.log(`  inventory primary map:      ${primaryBySlug.size}`);
  console.log(`Active (indexed):             ${active.length}`);
  console.log(`Inactive (excluded):          ${inactive.length}`);
  console.log(`Localized nested tool URLs:   ${sitemapPaths.length}`);
  console.log(`Sample heic-to-jpg:           ${heicSample}`);

  if (!heicOk) {
    console.error("\nFAIL: heic-to-jpg must resolve to /tools/image-tools/heic-to-jpg/");
    process.exitCode = 1;
    return;
  }

  if (missingRequired.length) {
    console.error("\nFAIL: required tools missing from canonical merge:");
    for (const slug of missingRequired) console.error(`  - ${slug}`);
    process.exitCode = 1;
    return;
  }

  const flatLeak = sitemapPaths.filter((p) => /\/tools\/[a-z0-9-]+\/$/i.test(p) && !p.includes("-tools/"));
  // Nested form has 4 segments after locale: tools / hub / slug /
  // Flat leak: /en/tools/heic-to-jpg/ (3 segments)
  const trulyFlat = sitemapPaths.filter((p) => {
    const parts = p.split("/").filter(Boolean);
    // en, tools, slug  → flat
    // en, tools, hub, slug → nested
    return parts.length === 3 && parts[1] === "tools";
  });

  if (trulyFlat.length) {
    console.error(`\nFAIL: ${trulyFlat.length} flat tool URLs still present (expected nested):`);
    for (const p of trulyFlat.slice(0, 15)) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nOK: nested hierarchy paths look correct.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
