import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pingSearchEngines } from "./ping-search-engines.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const outputPath = path.join(root, "sitemap.xml");

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

const registry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));
const baseUrl = (registry.site && registry.site.baseUrl ? registry.site.baseUrl : "https://joinmypdf.com").replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);

const urls = [];
urls.push({ loc: baseUrl + "/", priority: "1.0", changefreq: "daily" });
urls.push({ loc: baseUrl + "/blog/", priority: "0.9", changefreq: "daily", lastmod: today });

for (const tool of registry.tools || []) {
  const toolLastmod = tool.updatedAt || today;
  const toolPriority = Number.isFinite(Number(tool.priority)) ? Number(tool.priority).toFixed(2) : "0.90";
  const longTailPriority = Number.isFinite(Number(tool.longTailPriority))
    ? Number(tool.longTailPriority).toFixed(2)
    : "0.60";
  urls.push({ loc: baseUrl + "/tools/" + tool.slug + "/", priority: toolPriority, changefreq: "weekly", lastmod: toolLastmod });
  const variants = generateClusterVariants(tool, registry.clusterDefaults || {});
  for (const variant of variants) {
    urls.push({ loc: baseUrl + "/tools/" + variant.slug + "/", priority: longTailPriority, changefreq: "weekly", lastmod: toolLastmod });
  }
}

for (const post of blogRegistry.blog || []) {
  const blogPriority = Number.isFinite(Number(post.priority)) ? Number(post.priority).toFixed(2) : "0.80";
  urls.push({
    loc: baseUrl + "/blog/" + post.slug + "/",
    priority: blogPriority,
    changefreq: "weekly",
    lastmod: post.publishDate || today,
  });
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
        "  </url>"
    )
    .join("\n") +
  "\n</urlset>\n";

await writeFile(outputPath, xml, "utf8");
console.log("Sitemap generated:", outputPath);

const sitemapUrl = baseUrl + "/sitemap.xml";
try {
  await pingSearchEngines(sitemapUrl, { maxAttempts: 2 });
} catch (error) {
  console.log("[ping] skipped after sitemap generation:", error && error.message ? error.message : "unknown");
}
