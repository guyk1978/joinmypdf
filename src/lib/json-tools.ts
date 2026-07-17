import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const JSON_TOOLS_HUB_PATH = "/tools/json-tools/";
export const JSON_TOOL_IDS = getInventoryIdsByCategory("json") as readonly string[];
export type JsonToolId = string;

export function buildJsonToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("json", t, locale);
}

export function getJsonToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("json", t);
}
