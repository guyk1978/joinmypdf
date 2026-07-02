import "server-only";

import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { getBlogRegistry } from "@/lib/blog-registry";
import { HOME_DATA_CONVERSION_TOOL_IDS } from "@/lib/data-conversion-tools";
import { HOME_DEVELOPER_TOOL_IDS } from "@/lib/developer-tools";
import { HOME_FAVICON_TOOL_IDS } from "@/lib/favicon-tools";
import { HOME_IMAGE_TOOL_IDS } from "@/lib/image-tools";
import { HOME_PRODUCTIVITY_TOOL_IDS } from "@/lib/productivity-tools";
import { HOME_SECURITY_TOOL_IDS } from "@/lib/security-tools";
import { HOME_TEXT_JSON_TOOL_IDS } from "@/lib/text-json-tools";
import { registry } from "@/lib/registry";

export type InventoryCategoryId =
  | "pdf"
  | "image"
  | "developer"
  | "data"
  | "security"
  | "productivity"
  | "utilities"
  | "articles";

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategoryId;
  path: string;
  source: string;
};

export type InventoryCategoryGroup = {
  id: InventoryCategoryId;
  label: string;
  items: InventoryItem[];
};

export const INVENTORY_CATEGORY_META: ReadonlyArray<{ id: InventoryCategoryId; label: string }> = [
  { id: "pdf", label: "PDF" },
  { id: "image", label: "Image" },
  { id: "developer", label: "Developer" },
  { id: "data", label: "Data & Conversion" },
  { id: "security", label: "Security" },
  { id: "productivity", label: "Productivity" },
  { id: "utilities", label: "Utilities" },
  { id: "articles", label: "Articles" },
];

const CATEGORY_SLUG_MAP = new Map<string, InventoryCategoryId>();

function registerCategorySlugs(ids: readonly string[], category: InventoryCategoryId) {
  for (const id of ids) {
    if (!CATEGORY_SLUG_MAP.has(id)) {
      CATEGORY_SLUG_MAP.set(id, category);
    }
  }
}

registerCategorySlugs(HOME_IMAGE_TOOL_IDS, "image");
registerCategorySlugs(HOME_DEVELOPER_TOOL_IDS, "developer");
registerCategorySlugs(HOME_DATA_CONVERSION_TOOL_IDS, "data");
registerCategorySlugs(HOME_SECURITY_TOOL_IDS, "security");
registerCategorySlugs(HOME_PRODUCTIVITY_TOOL_IDS, "productivity");

for (const id of HOME_FAVICON_TOOL_IDS) {
  if (!CATEGORY_SLUG_MAP.has(id)) CATEGORY_SLUG_MAP.set(id, "utilities");
}
for (const id of HOME_TEXT_JSON_TOOL_IDS) {
  if (!CATEGORY_SLUG_MAP.has(id)) CATEGORY_SLUG_MAP.set(id, "utilities");
}

function resolveToolCategory(slug: string): InventoryCategoryId {
  return CATEGORY_SLUG_MAP.get(slug) ?? "pdf";
}

function pascalToKebab(value: string): string {
  return value
    .replace(/Workspace$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** Scan src/components/tools for workspace modules (build-time / server runtime). */
function scanComponentToolSlugs(): { slug: string; componentPath: string; folder: string }[] {
  const toolsRoot = path.join(process.cwd(), "src", "components", "tools");
  const discovered: { slug: string; componentPath: string; folder: string }[] = [];
  const seen = new Set<string>();

  let folders: string[] = [];
  try {
    folders = readdirSync(toolsRoot).filter((entry) => {
      try {
        return statSync(path.join(toolsRoot, entry)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return discovered;
  }

  for (const folder of folders) {
    const folderPath = path.join(toolsRoot, folder);
    let files: string[] = [];
    try {
      files = readdirSync(folderPath).filter((file) => file.endsWith(".tsx"));
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith("Workspace.tsx")) continue;
      const base = file.replace(/\.tsx$/, "");
      const slug = pascalToKebab(base);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      discovered.push({
        slug,
        folder,
        componentPath: `src/components/tools/${folder}/${file}`,
      });
    }
  }

  return discovered.sort((a, b) => a.slug.localeCompare(b.slug));
}

function buildToolInventoryItems(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const seen = new Set<string>();

  for (const tool of registry.tools) {
    const category = resolveToolCategory(tool.slug);
    items.push({
      id: tool.slug,
      name: tool.title,
      category,
      path: `/tools/${tool.slug}/`,
      source: "assets/data/tools.json",
    });
    seen.add(tool.slug);
  }

  for (const entry of scanComponentToolSlugs()) {
    if (seen.has(entry.slug)) continue;
    const registryTool = registry.tools.find((tool) => tool.slug === entry.slug);
    items.push({
      id: entry.slug,
      name: registryTool?.title ?? entry.slug,
      category: resolveToolCategory(entry.slug),
      path: `/tools/${entry.slug}/`,
      source: entry.componentPath,
    });
    seen.add(entry.slug);
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

function buildArticleInventoryItems(): InventoryItem[] {
  const posts = getBlogRegistry("en").blog ?? [];
  return posts
    .map((post) => ({
      id: post.slug,
      name: post.title,
      category: "articles" as const,
      path: `/blog/${post.slug}/`,
      source: "assets/data/blog.json",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Master site inventory — rebuilt from registry, blog data, and component scan. */
export function buildSiteInventory(): InventoryCategoryGroup[] {
  const allItems = [...buildToolInventoryItems(), ...buildArticleInventoryItems()];

  return INVENTORY_CATEGORY_META.map((meta) => ({
    id: meta.id,
    label: meta.label,
    items: allItems
      .filter((item) => item.category === meta.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0);
}

export function getSiteInventoryTotals(groups: InventoryCategoryGroup[]) {
  const itemCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  return { categoryCount: groups.length, itemCount };
}
