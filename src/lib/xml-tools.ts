import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const XML_TOOLS_HUB_PATH = "/tools/xml-tools/";
export const XML_TOOL_IDS = getInventoryIdsByCategory("xml") as readonly string[];
export type XmlToolId = string;

export function buildXmlToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("xml", t);
}

export function getXmlToolFeatureLabels(t?: InventoryTranslator): string[] {
  const labels = getInventoryFeatureLabels("xml", t);
  return labels.length ? labels : t?.has("schemaName") ? [t("schemaName")] : ["XML Tools"];
}
