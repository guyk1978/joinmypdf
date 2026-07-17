import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const PNG_TOOLS_HUB_PATH = "/tools/png-tools/";
export const PNG_TOOL_IDS = getInventoryIdsByCategory("png") as readonly string[];
export type PngToolId = string;

export function buildPngToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("png", t, locale);
}

export function getPngToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("png", t);
}
