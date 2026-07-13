/**
 * Generates src/data/tools-inventory.ts as multi-category SSOT.
 * Run: node scripts/generate-tools-inventory.cjs
 */
const fs = require("fs");
const path = require("path");

const root = "C:/joinmypdf";
const toolsJson = JSON.parse(fs.readFileSync(path.join(root, "assets/data/tools.json"), "utf8")).tools;
const audioJson = JSON.parse(fs.readFileSync(path.join(root, "assets/data/audio-tools.json"), "utf8"));
const bySlug = Object.fromEntries(toolsJson.map((t) => [t.slug, t]));

const TITLE_OVERRIDES = {
  "pdf-merge": "Merge PDF",
  "pdf-split": "Split PDF",
  "pdf-compress": "Compress PDF",
  "video-compressor": "MP4 Compressor",
  "video-converter": "Video Converter",
  "video-speed": "Video Speed Controller",
};

const PDF_SECTIONS = {
  mergeSplit: [
    "pdf-merge",
    "pdf-split",
    "extract-pdf-pages",
    "delete-pdf-pages",
    "reorder-pdf-pages",
    "n-up-pdf",
    "pdf-to-booklet",
  ],
  conversion: [
    "word-to-pdf",
    "excel-to-pdf",
    "powerpoint-to-pdf",
    "openoffice-to-pdf",
    "ebook-to-pdf",
    "iwork-to-pdf",
    "autocad-to-pdf",
    "jpg-to-pdf",
    "png-to-pdf",
    "heic-to-pdf",
    "markdown-to-pdf",
    "html-to-pdf",
    "pdf-to-word",
    "pdf-to-excel",
    "pdf-to-powerpoint",
    "pdf-to-jpg",
    "pdf-to-png",
    "pdf-to-text",
    "pdf-to-html",
    "pdf-to-epub",
    "pdf-to-xps",
    "extract-images",
    "extract-tables-pdf",
    "grayscale-pdf",
    "pdf-a-converter",
  ],
  compression: ["pdf-compress", "pdf-linearization", "flatten-pdf", "repair-pdf"],
  securityUtilities: [
    "protect-pdf",
    "unlock-pdf",
    "pdf-password-recovery",
    "redact-pdf",
    "safe-to-share-auditor",
    "remove-hidden-metadata",
    "sign-pdf",
    "pdf-signature-validator",
    "rotate-pdf",
    "crop-pdf",
    "add-page-numbers",
    "add-watermark",
    "annotate-pdf",
    "pdf-editor",
    "compare-pdf",
    "pdf-metadata-editor",
    "pdf-text-editor",
    "batch-rename-pdf",
    "custom-paper-margin",
  ],
};

const PDF_SECTION_BY_ID = {};
for (const [section, ids] of Object.entries(PDF_SECTIONS)) {
  for (const id of ids) PDF_SECTION_BY_ID[id] = section;
}

/** Parse TOOL_DEFINITIONS from tools.ts without TS import. */
const toolsTs = fs.readFileSync(path.join(root, "src/config/tools.ts"), "utf8");
const defBlock = toolsTs.match(/export const TOOL_DEFINITIONS[^=]*= \[([\s\S]*?)\];\s*\n\s*\/\*\*/);
if (!defBlock) throw new Error("TOOL_DEFINITIONS not found");
const defRe =
  /\{\s*slug:\s*"([^"]+)"\s*,\s*labelKey:\s*"([^"]+)"\s*,\s*categories:\s*\[([^\]]+)\]/g;
const definitions = [];
let m;
while ((m = defRe.exec(defBlock[1]))) {
  const cats = [...m[3].matchAll(/c\.(\w+)/g)].map((x) => x[1]);
  definitions.push({ slug: m[1], labelKey: m[2], navCategories: cats });
}

const NAV_TO_HUBS = {
  compress: ["compress"],
  pdfEdit: ["pdf"],
  pdfSecurity: ["pdf", "security"],
  pdfConvertIn: ["pdf", "convert"],
  pdfExport: ["pdf", "convert"],
  image: ["image"],
  video: ["video", "mp4"],
  favicon: ["favicon"],
  developerBrowser: ["developer"],
  developerTokens: ["developer"],
  developerGenerators: ["developer"],
  developerJson: ["developer", "json"],
  developerPublish: ["developer", "convert"],
  developerWorkflows: ["developer"],
  utilitiesEncoders: ["text", "developer"],
  utilitiesText: ["text"],
  dataConversion: ["data", "convert"],
  security: ["security"],
  productivity: ["productivity", "text"],
  design: ["design"],
};

function unique(arr) {
  return [...new Set(arr)];
}

function addHubRules(slug, hubs) {
  const h = new Set(hubs);

  // PDF membership already from nav; reinforce convert/compress/extract
  if (PDF_SECTION_BY_ID[slug]) h.add("pdf");
  if (PDF_SECTION_BY_ID[slug] === "compression" || slug === "pdf-compress") h.add("compress");
  if (
    [
      "pdf-to-text",
      "extract-images",
      "extract-tables-pdf",
      "extract-pdf-pages",
      "pdf-to-word",
      "pdf-to-excel",
    ].includes(slug)
  ) {
    h.add("extract");
  }
  if (
    slug.includes("to-pdf") ||
    slug.includes("pdf-to") ||
    slug.includes("to-jpg") ||
    slug.includes("to-png") ||
    slug.includes("to-gif") ||
    slug.includes("to-mp3") ||
    slug.includes("to-mp4") ||
    slug.includes("to-wav") ||
    slug === "video-converter" ||
    slug === "image-converter" ||
    slug === "convert-to-png" ||
    slug === "yaml-json-converter" ||
    slug === "csv-to-json" ||
    slug === "json-to-csv" ||
    slug === "html-markdown-converter"
  ) {
    h.add("convert");
  }

  if (slug.includes("jpg") || slug === "compress-image" || slug === "webp-to-jpg" || slug === "heic-to-jpg") {
    h.add("jpg");
    h.add("image");
  }
  if (slug.includes("png") || slug === "image-optimizer" || slug === "convert-to-png" || slug === "svg-to-png") {
    h.add("png");
    h.add("image");
  }
  if (["resize-image", "crop-image", "rotate-image", "flip-image", "paint-on-image", "image-grayscale", "image-metadata-editor", "image-converter"].includes(slug)) {
    h.add("image");
  }
  if (slug === "crop-image" || slug === "crop-pdf" || slug === "favicon-cropper") h.add("crop");
  if (slug === "rotate-image" || slug === "rotate-pdf" || slug === "video-rotator") h.add("rotate");
  if (slug.includes("word") || slug === "pdf-to-word" || slug === "word-to-pdf") h.add("word");
  if (slug.includes("excel") || slug === "pdf-to-excel" || slug === "excel-to-pdf" || slug === "extract-tables-pdf") {
    h.add("excel");
  }

  if (slug.startsWith("video-") || slug === "mp4-to-mp3") {
    h.add("video");
    h.add("mp4");
  }
  if (slug === "video-compressor") h.add("compress");
  if (["video-to-mp4", "video-converter", "video-to-gif", "video-to-mp3", "mp4-to-mp3"].includes(slug)) {
    h.add("convert");
  }

  if (slug.includes("mp3") || slug.includes("wav") || slug.includes("flac") || slug.includes("ogg") || slug.includes("m4a") || slug.includes("audio")) {
    h.add("mp3");
    h.add("audio");
  }
  if (slug === "audio-compressor" || slug === "mp3-compressor") h.add("compress");

  if (slug.includes("json")) h.add("json");
  if (slug.includes("yaml")) h.add("yaml");
  if (slug.includes("xml")) h.add("xml");
  if (slug.includes("favicon") || slug.includes("ico") || slug === "apple-touch-icon") h.add("favicon");

  if (
    [
      "case-converter",
      "word-character-counter",
      "text-diff-checker",
      "text-diff",
      "text-workspace",
      "string-generator",
      "reading-time-calculator",
      "html-markdown-converter",
      "base64-encoder-decoder",
      "url-encoder-decoder",
      "lorem-ipsum-generator",
    ].includes(slug)
  ) {
    h.add("text");
  }

  return unique([...h]);
}

function pickPrimary(slug, hubs, navCategories) {
  if (hubs.includes("pdf") && (navCategories.includes("pdfEdit") || navCategories.includes("pdfSecurity") || navCategories.includes("pdfConvertIn") || navCategories.includes("pdfExport") || PDF_SECTION_BY_ID[slug])) {
    return "pdf";
  }
  if (hubs.includes("video")) return "video";
  if (hubs.includes("favicon")) return "favicon";
  if (hubs.includes("mp3") || hubs.includes("audio")) return "mp3";
  if (hubs.includes("image") || hubs.includes("jpg") || hubs.includes("png")) return "image";
  if (hubs.includes("json")) return "json";
  if (hubs.includes("developer")) return "developer";
  if (hubs.includes("data")) return "data";
  if (hubs.includes("security")) return "security";
  if (hubs.includes("compress")) return "compress";
  if (hubs.includes("convert")) return "convert";
  if (hubs.includes("text")) return "text";
  if (hubs.includes("productivity")) return "productivity";
  if (hubs.includes("design")) return "design";
  return hubs[0] || "convert";
}

function cleanTitle(slug, raw) {
  if (TITLE_OVERRIDES[slug]) return TITLE_OVERRIDES[slug];
  return String(raw || slug)
    .replace(/\s+Online$/i, "")
    .replace(/\s+—.*$/, "")
    .replace(/\s+Converter$/i, (m) => m)
    .trim();
}

const inventoryMap = new Map();

function upsert({ id, title, description, labelKey, navCategories = [], extraHubs = [] }) {
  const fromNav = navCategories.flatMap((c) => NAV_TO_HUBS[c] || []);
  const categories = addHubRules(id, [...fromNav, ...extraHubs]);
  const primaryCategory = pickPrimary(id, categories, navCategories);
  const existing = inventoryMap.get(id);
  const entry = {
    id,
    title: cleanTitle(id, title || existing?.title),
    path: `/tools/${id}/`,
    description: description || existing?.description || `${cleanTitle(id, title)} — local browser processing, zero upload.`,
    categories,
    primaryCategory,
    labelKey: labelKey || existing?.labelKey,
    pdfSection: PDF_SECTION_BY_ID[id],
  };
  inventoryMap.set(id, entry);
}

for (const def of definitions) {
  const seo = bySlug[def.slug];
  upsert({
    id: def.slug,
    title: seo?.title || def.slug,
    description: seo?.description,
    labelKey: def.labelKey,
    navCategories: def.navCategories,
  });
}

for (const audio of audioJson) {
  upsert({
    id: audio.slug || audio.id,
    title: audio.title || audio.name,
    description: audio.description || audio.title,
    labelKey: undefined,
    extraHubs: ["mp3", "audio"],
  });
}

// Ensure every PDF section tool exists even if only in tools.json
for (const id of Object.keys(PDF_SECTION_BY_ID)) {
  if (!inventoryMap.has(id) && bySlug[id]) {
    upsert({
      id,
      title: bySlug[id].title,
      description: bySlug[id].description,
      extraHubs: ["pdf"],
    });
  }
}

const entries = [...inventoryMap.values()].sort((a, b) => a.id.localeCompare(b.id));

function emitEntry(e) {
  const cats = e.categories.map((c) => JSON.stringify(c)).join(", ");
  const lines = [
    "  {",
    `    id: ${JSON.stringify(e.id)},`,
    `    title: ${JSON.stringify(e.title)},`,
    `    path: ${JSON.stringify(e.path)},`,
    `    description: ${JSON.stringify(e.description)},`,
    `    categories: [${cats}] as const,`,
    `    primaryCategory: ${JSON.stringify(e.primaryCategory)},`,
  ];
  if (e.pdfSection) lines.push(`    pdfSection: ${JSON.stringify(e.pdfSection)},`);
  if (e.labelKey) lines.push(`    labelKey: ${JSON.stringify(e.labelKey)},`);
  lines.push("  }");
  return lines.join("\n");
}

const out = `/**
 * Single source of truth for hub membership and multi-category tags.
 * SEO copy / FAQ / long-tail remain in \`assets/data/tools.json\`.
 * Nav label keys remain aligned with \`TOOL_DEFINITIONS\` via optional \`labelKey\`.
 *
 * Regenerate with: node scripts/generate-tools-inventory.cjs
 */

import type {
  InventoryCategoryId,
  PdfInventorySectionId,
  ToolsInventoryEntry,
} from "@/data/inventory-hubs";

export type {
  InventoryCategoryId,
  PdfInventorySectionId,
  ToolsInventoryEntry,
} from "@/data/inventory-hubs";

export { INVENTORY_HUB_META } from "@/data/inventory-hubs";

export const TOOLS_INVENTORY: readonly ToolsInventoryEntry[] = [
${entries.map(emitEntry).join(",\n")},
];

export type ToolsInventoryId = string;

export const TOOLS_INVENTORY_IDS = TOOLS_INVENTORY.map((tool) => tool.id);

function entryHasCategory(tool: ToolsInventoryEntry, category: InventoryCategoryId): boolean {
  return tool.categories.includes(category);
}

/** @deprecated Prefer TOOLS_INVENTORY + getInventoryToolsByCategory("video") */
export const VIDEO_TOOLS_INVENTORY = TOOLS_INVENTORY.filter((tool) =>
  entryHasCategory(tool, "video"),
);

export const VIDEO_TOOLS_INVENTORY_IDS = VIDEO_TOOLS_INVENTORY.map((tool) => tool.id);

/** @deprecated Prefer TOOLS_INVENTORY + getInventoryToolsByCategory("pdf") */
export const PDF_TOOLS_INVENTORY = TOOLS_INVENTORY.filter((tool) =>
  entryHasCategory(tool, "pdf"),
);

export const PDF_TOOLS_INVENTORY_IDS = PDF_TOOLS_INVENTORY.map((tool) => tool.id);

export type VideoToolsInventoryId = string;
export type PdfToolsInventoryId = string;

export const PDF_INVENTORY_SECTIONS: {
  id: PdfInventorySectionId;
  toolIds: readonly string[];
}[] = (
  ["mergeSplit", "conversion", "compression", "securityUtilities"] as const
).map((sectionId) => ({
  id: sectionId,
  toolIds: PDF_TOOLS_INVENTORY.filter((tool) => tool.pdfSection === sectionId).map((tool) => tool.id),
}));

export const TOOLS_INVENTORY_BY_CATEGORY = {
  get video() {
    return VIDEO_TOOLS_INVENTORY;
  },
  get pdf() {
    return PDF_TOOLS_INVENTORY;
  },
} as const;

export function getVideoToolsInventoryEntry(id: string) {
  return VIDEO_TOOLS_INVENTORY.find((tool) => tool.id === id);
}

export function getPdfToolsInventoryEntry(id: string) {
  return PDF_TOOLS_INVENTORY.find((tool) => tool.id === id);
}

export function getToolsInventoryEntry(id: string): ToolsInventoryEntry | undefined {
  return TOOLS_INVENTORY.find((tool) => tool.id === id);
}
`;

fs.writeFileSync(path.join(root, "src/data/tools-inventory.ts"), out);

// summary
const byCat = {};
for (const e of entries) {
  for (const c of e.categories) {
    byCat[c] = (byCat[c] || 0) + 1;
  }
}
console.log("tools", entries.length);
console.log(byCat);
