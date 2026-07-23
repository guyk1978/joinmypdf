import {
  buildInventoryGridItemsForIds,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const EXTRACT_TOOLS_HUB_PATH = "/tools/extract-tools/";

/**
 * Canonical Extract hub membership + display order.
 * Keep conversion tools (pdf-to-word / text / excel) out of this list.
 */
export const EXTRACT_TOOL_ORDER = [
  "extract-pdf-pages",
  "extract-tables-pdf",
  "extract-images",
  "color-palette-extractor",
] as const;

export type ExtractToolId = (typeof EXTRACT_TOOL_ORDER)[number];

/** Ordered extract hub ids (source of truth for hub grid + static params). */
export const EXTRACT_TOOL_IDS: string[] = [...EXTRACT_TOOL_ORDER];

export function buildExtractToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItemsForIds(EXTRACT_TOOL_IDS, t, "extract", locale);
}

export function getExtractToolFeatureLabels(t?: InventoryTranslator): string[] {
  return buildExtractToolGridItems(t).map((item) => item.label);
}
