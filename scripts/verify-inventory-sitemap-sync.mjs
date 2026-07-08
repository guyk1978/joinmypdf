/**
 * Verify canonical inventory tool sources are covered by sitemap generation.
 * Run: node scripts/verify-inventory-sitemap-sync.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  const all = [...bySlug.values()];
  const active = all.filter((tool) => (statusMap[tool.slug] || "active") === "active");
  const inactive = all.filter((tool) => (statusMap[tool.slug] || "active") === "inactive");

  const sitemapPaths = active.flatMap((tool) =>
    LOCALES.map((locale) => `/${locale}/tools/${tool.slug}/`),
  );

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
  ];
  const missingRequired = requiredExtras.filter((slug) => !bySlug.has(slug));

  console.log("=== Inventory ↔ Sitemap sync ===");
  console.log(`Canonical tools (JSON merge): ${all.length}`);
  console.log(`  from tools.json:            ${(registry.tools || []).length}`);
  console.log(`  audio appended:             ${audioTools.length}`);
  console.log(`  studio tools file:          ${studioTools.length}`);
  console.log(`Active (indexed):             ${active.length}`);
  console.log(`Inactive (excluded):          ${inactive.length}`);
  console.log(`Localized tool URLs:          ${sitemapPaths.length}`);

  if (missingRequired.length) {
    console.error("\nFAIL: required tools missing from canonical merge:");
    for (const slug of missingRequired) console.error(`  - ${slug}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nOK: inventory registry tools are present for sitemap generation.");
  console.log("Sample sitemap paths:");
  for (const sample of [
    ...LOCALES.map((locale) => `/${locale}/tools/timeline-gantt-generator/`),
    ...LOCALES.map((locale) => `/${locale}/tools/mp3-converter/`),
  ]) {
    const ok = sitemapPaths.includes(sample);
    console.log(`  ${ok ? "✓" : "✗"} ${sample}`);
    if (!ok) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
