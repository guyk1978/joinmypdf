/**
 * Shared category → hub segment map for Node sitemap scripts.
 * Mirrors src/lib/tool-hierarchy.ts + INVENTORY_HUB_META (/tools/ nests).
 */
export const CATEGORY_HUB_SEGMENT = {
  pdf: "pdf-tools",
  video: "video-tools",
  mp4: "mp4-tools",
  convert: "convert-tools",
  compress: "compress-tools",
  extract: "extract-tools",
  image: "image-tools",
  jpg: "jpg-tools",
  png: "png-tools",
  mp3: "mp3-tools",
  audio: "mp3-tools",
  favicon: "favicon-tools",
  text: "text-tools",
  json: "json-tools",
  yaml: "yaml-tools",
  xml: "xml-tools",
  developer: "developer-tools",
  word: "word-tools",
  excel: "excel-tools",
  crop: "crop-tools",
  rotate: "rotate-tools",
  security: "security-tools",
  design: "developer-tools",
  data: "data-conversion-tools",
  productivity: "productivity-tools",
  "unit-math": "unit-converters",
  network: "network-tools",
};

export function buildNestedToolPath(slug, categoryId) {
  const segment = CATEGORY_HUB_SEGMENT[categoryId];
  if (!segment) return `/tools/${slug}/`;
  return `/tools/${segment}/${slug}/`;
}

/**
 * Parse TOOLS_INVENTORY primaryCategory map from tools-inventory.ts source.
 * @returns {Map<string, string>} slug → primaryCategory
 */
export function parseInventoryPrimaryCategories(inventorySource) {
  const map = new Map();
  const blockRe =
    /\{\s*id:\s*"([^"]+)"[\s\S]*?primaryCategory:\s*"([^"]+)"/g;
  let match;
  while ((match = blockRe.exec(inventorySource))) {
    map.set(match[1], match[2]);
  }
  return map;
}

export function resolveNestedToolPath(slug, primaryBySlug) {
  const category = primaryBySlug.get(slug);
  return category ? buildNestedToolPath(slug, category) : `/tools/${slug}/`;
}

export function listCategoryHubPaths() {
  const paths = new Set();
  for (const segment of Object.values(CATEGORY_HUB_SEGMENT)) {
    paths.add(`/tools/${segment}/`);
  }
  return [...paths].sort();
}
