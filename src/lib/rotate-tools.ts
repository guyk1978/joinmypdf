import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const ROTATE_TOOLS_HUB_PATH = "/tools/rotate-tools/";
export const ROTATE_TOOL_IDS = getInventoryIdsByCategory("rotate") as readonly string[];
export type RotateToolId = string;

export function buildRotateToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("rotate", t);
}

export function getRotateToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("rotate", t);
}
