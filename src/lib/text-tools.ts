import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const TEXT_TOOLS_HUB_PATH = "/tools/text-tools/";
export const TEXT_TOOL_IDS = getInventoryIdsByCategory("text") as readonly string[];
export type TextToolId = string;

export function buildTextToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("text", t);
}

export function getTextToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("text", t);
}
