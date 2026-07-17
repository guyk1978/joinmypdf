import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const CROP_TOOLS_HUB_PATH = "/tools/crop-tools/";
export const CROP_TOOL_IDS = getInventoryIdsByCategory("crop") as readonly string[];
export type CropToolId = string;

export function buildCropToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("crop", t, locale);
}

export function getCropToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("crop", t);
}
