/**
 * Factory helpers for nested hub tool routes:
 * `/tools/{hub-segment}/[slug]/`
 *
 * Important: with `output: "export"`, `generateStaticParams` must return at least
 * one path. Do not mount a `[slug]` route for hubs with zero inventory tools.
 *
 * Dedicated App Router pages (`tools/{slug}/page.tsx`) that are NOT in the
 * registry are excluded here — they are nested via
 * `scripts/generate-hub-dedicated-tool-pages.cjs`. Registry-backed tools
 * (including those with a dedicated page) stay in `[slug]` params so the
 * catch-all can render their workspace component.
 */
import { existsSync } from "fs";
import path from "path";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { getCategoryHubSegment } from "@/lib/tool-hierarchy";
import {
  getLocalizedToolSlug,
  listPdfToolPublicSlugs,
  listVideoToolPublicSlugs,
} from "@/lib/locale-tool-slugs";
import { registry } from "@/lib/registry";

function hasDedicatedToolPage(slug: string): boolean {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "";
  if (!cwd) return false;
  return existsSync(path.join(cwd, "src", "app", "[locale]", "tools", slug, "page.tsx"));
}

function isRegistryTool(slug: string): boolean {
  return registry.tools.some((tool) => tool.slug === slug);
}

export function listHubToolStaticParams(categoryId: InventoryCategoryId): { slug: string }[] {
  const inventoryIds = getInventoryToolsByCategory(categoryId).map((tool) => tool.id);
  const base = inventoryIds.filter((id) => {
    if (!hasDedicatedToolPage(id)) return true;
    // Dedicated + registered → catch-all can render the workspace.
    return isRegistryTool(id);
  });

  const slugs = new Set(base);
  // PDF / video hubs also emit full Russian SEO slug unions for static export.
  if (categoryId === "pdf") {
    for (const slug of listPdfToolPublicSlugs()) {
      slugs.add(slug);
    }
  }
  if (categoryId === "video" || categoryId === "mp4") {
    for (const slug of listVideoToolPublicSlugs()) {
      slugs.add(slug);
    }
  }
  // Every hub: add RU aliases for all inventory tools in this category so
  // localized nested URLs are generated even when a dedicated EN page exists.
  // Catch-all rendering still requires registry / audio resolution.
  for (const id of inventoryIds) {
    const localized = getLocalizedToolSlug(id, "ru");
    if (localized !== id) slugs.add(localized);
    // Keep English ids for dedicated tools that can also render via catch-all.
    if (isRegistryTool(id) || !hasDedicatedToolPage(id)) {
      slugs.add(id);
    }
  }

  return [...slugs].map((slug) => ({ slug }));
}

/** @deprecated Prefer listHubToolStaticParams inside an explicit generateStaticParams. */
export function createHubToolStaticParams(categoryId: InventoryCategoryId) {
  return function generateStaticParams() {
    const params = listHubToolStaticParams(categoryId);
    if (params.length === 0) {
      throw new Error(
        `Hub "${categoryId}" has no inventory tools — remove its [slug] route for static export.`,
      );
    }
    return params;
  };
}

export function hubSegmentForCategory(categoryId: InventoryCategoryId): string {
  return getCategoryHubSegment(categoryId);
}
