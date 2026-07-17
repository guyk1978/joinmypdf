/**
 * Factory helpers for nested hub tool routes:
 * `/tools/{hub-segment}/[slug]/`
 *
 * Important: with `output: "export"`, `generateStaticParams` must return at least
 * one path. Do not mount a `[slug]` route for hubs with zero inventory tools.
 */
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { getCategoryHubSegment } from "@/lib/tool-hierarchy";

export function listHubToolStaticParams(categoryId: InventoryCategoryId): { slug: string }[] {
  return getInventoryToolsByCategory(categoryId).map((tool) => ({
    slug: tool.id,
  }));
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
