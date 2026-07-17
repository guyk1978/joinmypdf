/**
 * Factory helpers for nested hub tool routes:
 * `/tools/{hub-segment}/[slug]/`
 */
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { getCategoryHubSegment } from "@/lib/tool-hierarchy";

export function createHubToolStaticParams(categoryId: InventoryCategoryId) {
  return function generateStaticParams() {
    return getInventoryToolsByCategory(categoryId).map((tool) => ({
      slug: tool.id,
    }));
  };
}

export function hubSegmentForCategory(categoryId: InventoryCategoryId): string {
  return getCategoryHubSegment(categoryId);
}
