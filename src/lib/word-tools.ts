import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const WORD_TOOLS_HUB_PATH = "/tools/word-tools/";
export const WORD_TOOL_IDS = getInventoryIdsByCategory("word") as readonly string[];
export type WordToolId = string;

export function buildWordToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("word", t, locale);
}

export function getWordToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("word", t);
}
