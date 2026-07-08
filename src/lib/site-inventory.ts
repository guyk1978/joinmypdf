import "server-only";

import { getBlogRegistry } from "@/lib/blog-registry";
import { getCanonicalTools, type CanonicalTool } from "@/lib/canonical-tools";
import {
  getInventoryToolStatus,
  readInventoryStatusMap,
  type InventoryToolStatus,
} from "@/lib/inventory-status";
import {
  INVENTORY_CATEGORY_META,
  type InventoryCategoryGroup,
  type InventoryItem,
} from "@/lib/site-inventory-types";

export type {
  InventoryCategoryGroup,
  InventoryCategoryId,
  InventoryItem,
  InventoryToolStatus,
} from "@/lib/site-inventory-types";
export { INVENTORY_CATEGORY_META } from "@/lib/site-inventory-types";

function toolToInventoryItem(tool: CanonicalTool, status: InventoryToolStatus): InventoryItem {
  return {
    id: tool.slug,
    slug: tool.slug,
    name: tool.title,
    description: tool.description,
    category: tool.category,
    path: tool.path,
    source: tool.sources.join(" + "),
    status,
  };
}

function buildToolInventoryItems(): InventoryItem[] {
  const statusMap = readInventoryStatusMap();
  return getCanonicalTools().map((tool) =>
    toolToInventoryItem(tool, statusMap[tool.slug] ?? "active"),
  );
}

function buildArticleInventoryItems(): InventoryItem[] {
  const posts = getBlogRegistry("en").blog ?? [];
  return posts
    .map((post) => ({
      id: post.slug,
      slug: post.slug,
      name: post.title,
      description: post.description?.trim() || post.seo?.metaDescription?.trim() || "",
      category: "articles" as const,
      path: `/blog/${post.slug}/`,
      source: "assets/data/blog.json",
      status: "active" as const,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Master site inventory — rebuilt from canonical tool catalog + blog data. */
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
  const toolCount = groups
    .filter((group) => group.id !== "articles")
    .reduce((sum, group) => sum + group.items.length, 0);
  const activeToolCount = groups
    .filter((group) => group.id !== "articles")
    .reduce(
      (sum, group) => sum + group.items.filter((item) => item.status === "active").length,
      0,
    );
  return { categoryCount: groups.length, itemCount, toolCount, activeToolCount };
}

export function getActiveCanonicalToolSlugs(): string[] {
  return getCanonicalTools()
    .filter((tool) => getInventoryToolStatus(tool.slug) === "active")
    .map((tool) => tool.slug);
}
