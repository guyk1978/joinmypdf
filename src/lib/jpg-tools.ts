import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const JPG_TOOLS_HUB_PATH = "/tools/jpg-tools/";
export const JPG_TOOL_IDS = getInventoryIdsByCategory("jpg") as readonly string[];
export type JpgToolId = string;

export function buildJpgToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("jpg", t);
}

export function getJpgToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("jpg", t);
}
