import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const MP3_TOOLS_HUB_PATH = "/tools/mp3-tools/";
export const MP3_TOOL_IDS = getInventoryIdsByCategory("mp3") as readonly string[];
export type Mp3ToolId = string;

export function buildMp3ToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("mp3", t, locale);
}

export function getMp3ToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("mp3", t);
}
