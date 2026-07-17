import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pingSearchEngines } from "./ping-search-engines.mjs";
import { loadMergedBlogRegistry } from "./lib/merge-blog-registry.mjs";
import {
  listAllNestedToolPaths,
  listCategoryHubPaths,
  parseInventoryHierarchy,
} from "./lib/sitemap-hierarchy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const audioToolsJsonPath = path.join(root, "assets", "data", "audio-tools.json");
const studioToolsJsonPath = path.join(root, "assets", "data", "studio-tools.json");
const inventoryTsPath = path.join(root, "src", "data", "tools-inventory.ts");
const inventoryStatusPath = path.join(root, "logs", "inventory-tool-status.json");
const outputPath = path.join(root, "sitemap.xml");

const LOCALES = ["en", "he"];

const MODIFIER_LIBRARY = [
  "fast",
  "free",
  "online",
  "mobile",
  "no-upload",
  "high-quality",
  "large-files",
  "no-signup",
  "secure",
  "instant",
];

const BASE_PATHS = [
  "/",
  "/tools/",
  "/premium-tools/",
  "/blog/",
  "/privacy-first/",
  "/privacy/",
  "/compare/",
  "/contact/",
  "/privacy-first-pdf-tools/",
  "/utilities/",
  "/text-json-tools/",
  "/developer-tools/",
  "/pdf-guides/",
  "/pdf-comparison/",
  "/pdf-privacy/",
  "/pdf-workflows/",
  ...listCategoryHubPaths(),
];

function localizedPaths(routePath) {
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return LOCALES.map((locale) => {
    if (normalized === "/") return `/${locale}/`;
    return `/${locale}${normalized}`;
  });
}

function generateClusterVariants(tool, config) {
  const modifiers = config.modifiers || MODIFIER_LIBRARY;
  const targetCount = Math.max(20, Math.min(100, Number(config.targetVariantCount || 24)));
  const manual = (tool.longTailPages || []).map((entry) => ({ slug: entry.slug }));
  const combos = [
    ["online", "fast"],
    ["free", "no-signup"],
    ["mobile", "fast"],
    ["high-quality", "online"],
    ["large-files", "fast"],
    ["secure", "no-upload"],
    ["instant", "online"],
    ["free", "mobile"],
    ["large-files", "high-quality"],
    ["no-upload", "mobile"],
  ];
  const generated = modifiers.map((modifier) => ({ slug: tool.slug + "-" + modifier }));
  const generatedCombos = combos.map((pair) => ({ slug: tool.slug + "-" + pair.join("-") }));
  const unique = new Map();
  manual.concat(generated, generatedCombos).forEach((entry) => {
    if (!unique.has(entry.slug)) unique.set(entry.slug, entry);
  });
  return Array.from(unique.values()).slice(0, targetCount);
}

function pushEntry(urls, seen, entry) {
  if (seen.has(entry.loc)) return;
  seen.add(entry.loc);
  urls.push(entry);
}

const registry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const audioTools = JSON.parse(await readFile(audioToolsJsonPath, "utf8"));
const studioToolsFile = JSON.parse(await readFile(studioToolsJsonPath, "utf8"));
const studioTools = studioToolsFile.tools || [];
const inventorySource = await readFile(inventoryTsPath, "utf8");
const hierarchy = parseInventoryHierarchy(inventorySource);

let inventoryStatus = {};
try {
  const statusFile = JSON.parse(await readFile(inventoryStatusPath, "utf8"));
  inventoryStatus = statusFile.tools || {};
} catch {
  inventoryStatus = {};
}

function isActiveSlug(slug) {
  return (inventoryStatus[slug] || "active") === "active";
}

await copyFile(
  path.join(root, "src/data/blog-registry.json"),
  path.join(root, "assets/data/blog-registry.json"),
);
try {
  await copyFile(
    path.join(root, "src/data/blog-registry-he.json"),
    path.join(root, "assets/data/blog-registry-he.json"),
  );
} catch {
  /* optional Hebrew editorial registry */
}

const blogRegistry = await loadMergedBlogRegistry({ root, readFile });
const baseUrl = (registry.site && registry.site.baseUrl ? registry.site.baseUrl : "https://joinmypdf.com").replace(
  /\/+$/,
  "",
);
const today = new Date().toISOString().slice(0, 10);

const urls = [];
const seen = new Set();

for (const routePath of BASE_PATHS) {
  for (const urlPath of localizedPaths(routePath)) {
    pushEntry(urls, seen, {
      loc: baseUrl + urlPath,
      priority: routePath === "/" ? "1.0" : routePath.startsWith("/tools") ? "0.92" : "0.85",
      changefreq: routePath === "/" ? "daily" : "weekly",
      lastmod: today,
    });
  }
}

const canonicalSlugs = new Map();

for (const tool of registry.tools || []) {
  if (!isActiveSlug(tool.slug)) continue;
  canonicalSlugs.set(tool.slug, {
    slug: tool.slug,
    priority:
      tool.priority != null && Number.isFinite(Number(tool.priority))
        ? Number(tool.priority).toFixed(2)
        : "0.90",
    lastmod: tool.updatedAt || today,
  });
}

for (const tool of audioTools || []) {
  if (!tool.slug || !isActiveSlug(tool.slug)) continue;
  if (!canonicalSlugs.has(tool.slug)) {
    canonicalSlugs.set(tool.slug, {
      slug: tool.slug,
      priority: "0.88",
      lastmod: today,
    });
  }
}

for (const tool of studioTools) {
  if (!tool.slug || !isActiveSlug(tool.slug)) continue;
  if (!canonicalSlugs.has(tool.slug)) {
    canonicalSlugs.set(tool.slug, {
      slug: tool.slug,
      priority: "0.92",
      lastmod: today,
    });
  }
}

// Category-first nested URLs: every hub membership (en + he), not only primary.
const nestedPriorityByPath = new Map();
for (const tool of canonicalSlugs.values()) {
  nestedPriorityByPath.set(tool.slug, tool);
}
for (const nestedPath of listAllNestedToolPaths(hierarchy)) {
  const slug = nestedPath.split("/").filter(Boolean).pop();
  if (!slug || !isActiveSlug(slug)) continue;
  const meta = nestedPriorityByPath.get(slug);
  for (const urlPath of localizedPaths(nestedPath)) {
    pushEntry(urls, seen, {
      loc: baseUrl + urlPath,
      priority: meta?.priority || "0.90",
      changefreq: "weekly",
      lastmod: meta?.lastmod || today,
    });
  }
}

// SEO cluster variants remain flat long-tail landings
for (const tool of registry.tools || []) {
  if (!isActiveSlug(tool.slug)) continue;
  const toolLastmod = tool.updatedAt || today;
  const longTailPriority =
    tool.longTailPriority != null && Number.isFinite(Number(tool.longTailPriority))
      ? Number(tool.longTailPriority).toFixed(2)
      : "0.60";

  const variants = generateClusterVariants(tool, registry.clusterDefaults || {});
  for (const variant of variants) {
    for (const urlPath of localizedPaths(`/tools/${variant.slug}/`)) {
      pushEntry(urls, seen, {
        loc: baseUrl + urlPath,
        priority: longTailPriority,
        changefreq: "weekly",
        lastmod: toolLastmod,
      });
    }
  }
}

for (const post of blogRegistry.blog || []) {
  const blogPriority =
    post.priority != null && Number.isFinite(Number(post.priority))
      ? Number(post.priority).toFixed(2)
      : post.tier1
        ? "0.82"
        : "0.65";
  for (const urlPath of localizedPaths(`/blog/${post.slug}/`)) {
    pushEntry(urls, seen, {
      loc: baseUrl + urlPath,
      priority: blogPriority,
      changefreq: "weekly",
      lastmod: post.publishDate || today,
    });
  }
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (entry) =>
        "  <url>\n" +
        "    <loc>" +
        entry.loc +
        "</loc>\n" +
        "    <lastmod>" +
        (entry.lastmod || today) +
        "</lastmod>\n" +
        "    <changefreq>" +
        entry.changefreq +
        "</changefreq>\n" +
        "    <priority>" +
        entry.priority +
        "</priority>\n" +
        "  </url>",
    )
    .join("\n") +
  "\n</urlset>\n";

await writeFile(outputPath, xml, "utf8");
console.log("Sitemap generated:", outputPath, `(${urls.length} URLs)`);
const jpgCompress = [...seen].find((loc) => loc.includes("/tools/jpg-tools/compress-image/"));
console.log("Sample compress-image under jpg-tools:", jpgCompress || "MISSING");
console.log(
  "Sample heic-to-jpg primary nest:",
  [...seen].find((loc) => loc.includes("/tools/image-tools/heic-to-jpg/")) || "MISSING",
);

const sitemapUrl = baseUrl + "/sitemap.xml";
try {
  await pingSearchEngines(sitemapUrl, { maxAttempts: 2 });
} catch (error) {
  console.log("[ping] skipped after sitemap generation:", error && error.message ? error.message : "unknown");
}
