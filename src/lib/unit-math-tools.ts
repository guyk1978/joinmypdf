import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const UNIT_CONVERTERS_HUB_PATH = "/tools/unit-converters/";

export function buildUnitMathToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("unit-math", t);
}

export function getUnitMathToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("unit-math", t);
}
