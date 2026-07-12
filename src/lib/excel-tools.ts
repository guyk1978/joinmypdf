import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const EXCEL_TOOLS_HUB_PATH = "/tools/excel-tools/";
export const EXCEL_TOOL_IDS = getInventoryIdsByCategory("excel") as readonly string[];
export type ExcelToolId = string;

export function buildExcelToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("excel", t);
}

export function getExcelToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("excel", t);
}
