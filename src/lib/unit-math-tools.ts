import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const UNIT_CONVERTERS_HUB_PATH = "/tools/unit-converters/";
export const UNIT_MATH_TOOL_IDS = getInventoryIdsByCategory("unit-math") as readonly string[];
export type UnitMathToolId = string;

export function buildUnitMathToolGridItems(
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItems("unit-math", t, locale);
}

export function getUnitMathToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("unit-math", t);
}
