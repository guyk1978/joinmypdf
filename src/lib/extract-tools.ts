import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const EXTRACT_TOOLS_HUB_PATH = "/tools/extract-tools/";

export function buildExtractToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("extract", t, locale);
}

export function getExtractToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("extract", t);
}

/** Dynamic extract hub membership from inventory. */
export const EXTRACT_TOOL_IDS = getInventoryIdsByCategory("extract");

export type ExtractToolId = string;
