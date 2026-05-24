import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const defaultTemplatePath = path.join(root, "tools", "pdf-merge", "index.html");
const protectTemplatePath = path.join(root, "tools", "protect-pdf", "index.html");

const registry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const defaultTemplate = await readFile(defaultTemplatePath, "utf8");
let protectTemplate = defaultTemplate;
try {
  protectTemplate = await readFile(protectTemplatePath, "utf8");
} catch {
  console.warn("protect-pdf template missing — using merge template until created.");
}

const toolsRoot = path.join(root, "tools");

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
  const baseKeyword = (tool.primaryKeyword || tool.slug.replaceAll("-", " ")).replace(/\bonline\b/gi, "").trim();
  const manual = (tool.longTailPages || []).map((entry) => ({
    slug: entry.slug,
    keyword: entry.keyword || baseKeyword + " " + (entry.modifier || ""),
  }));
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
  const generated = modifiers.map((modifier) => ({
    slug: tool.slug + "-" + modifier,
    keyword: (baseKeyword + " " + modifier.replaceAll("-", " ")).trim(),
  }));
  const generatedCombos = combos.map((pair) => ({
    slug: tool.slug + "-" + pair.join("-"),
    keyword: (baseKeyword + " " + pair.join(" ").replaceAll("-", " ")).trim(),
  }));
  const unique = new Map();
  manual.concat(generated, generatedCombos).forEach((entry) => {
    if (!unique.has(entry.slug)) unique.set(entry.slug, entry);
  });
  return Array.from(unique.values()).slice(0, targetCount);
}

async function ensureToolPage(slug, tool) {
  const targetDir = path.join(toolsRoot, slug);
  await mkdir(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, "index.html");
  const html =
    slug === "protect-pdf" || tool?.operation === "protect" ? protectTemplate : defaultTemplate;
  await writeFile(targetFile, html, "utf8");
}

for (const tool of registry.tools) {
  await ensureToolPage(tool.slug, tool);
  if (tool.skipClusterVariants) continue;
  const variants = generateClusterVariants(tool, registry.clusterDefaults || {});
  for (const variant of variants) {
    await ensureToolPage(variant.slug, tool);
  }
}

console.log("SEO pages generated from tools.json");
