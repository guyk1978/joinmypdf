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

/**
 * Extra category nests forced into the sitemap (beyond inventory tags).
 * Ensures multi-hub tools like compress-image appear under jpg-tools.
 */
export const SITEMAP_CATEGORY_NEST_OVERRIDES = {
  "compress-image": ["jpg"],
};

export function buildNestedToolPath(slug, categoryId) {
  const segment = CATEGORY_HUB_SEGMENT[categoryId];
  if (!segment) return `/tools/${slug}/`;
  return `/tools/${segment}/${slug}/`;
}

/**
 * Parse TOOLS_INVENTORY membership from tools-inventory.ts source.
 * @returns {{
 *   primaryBySlug: Map<string, string>,
 *   categoriesBySlug: Map<string, string[]>,
 *   slugsByCategory: Map<string, string[]>,
 * }}
 */
export function parseInventoryHierarchy(inventorySource) {
  const primaryBySlug = new Map();
  const categoriesBySlug = new Map();
  const slugsByCategory = new Map();

  const blockRe =
    /\{\s*id:\s*"([^"]+)"[\s\S]*?categories:\s*\[([^\]]*)\][\s\S]*?primaryCategory:\s*"([^"]+)"/g;
  let match;
  while ((match = blockRe.exec(inventorySource))) {
    const slug = match[1];
    const categories = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const primary = match[3];
    if (!categories.includes(primary)) categories.push(primary);

    const extras = SITEMAP_CATEGORY_NEST_OVERRIDES[slug] || [];
    for (const extra of extras) {
      if (!categories.includes(extra)) categories.push(extra);
    }

    primaryBySlug.set(slug, primary);
    categoriesBySlug.set(slug, categories);

    for (const category of categories) {
      if (!slugsByCategory.has(category)) slugsByCategory.set(category, []);
      slugsByCategory.get(category).push(slug);
    }
  }

  return { primaryBySlug, categoriesBySlug, slugsByCategory };
}

/** @deprecated Prefer parseInventoryHierarchy().primaryBySlug */
export function parseInventoryPrimaryCategories(inventorySource) {
  return parseInventoryHierarchy(inventorySource).primaryBySlug;
}

export function resolveNestedToolPath(slug, primaryBySlug) {
  const category = primaryBySlug.get(slug);
  return category ? buildNestedToolPath(slug, category) : `/tools/${slug}/`;
}

/**
 * Category-first nested paths for every hub membership (not just primary).
 * @returns {string[]} locale-free paths like `/tools/jpg-tools/compress-image/`
 */
export function listAllNestedToolPaths(hierarchy) {
  const paths = new Set();
  for (const [categoryId, slugs] of hierarchy.slugsByCategory.entries()) {
    if (!CATEGORY_HUB_SEGMENT[categoryId]) continue;
    for (const slug of slugs) {
      paths.add(buildNestedToolPath(slug, categoryId));
    }
  }
  return [...paths].sort();
}

export function listCategoryHubPaths() {
  const paths = new Set();
  for (const segment of Object.values(CATEGORY_HUB_SEGMENT)) {
    paths.add(`/tools/${segment}/`);
  }
  return [...paths].sort();
}
