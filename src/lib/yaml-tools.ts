import {
  buildInventoryGridItems,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const YAML_TOOLS_HUB_PATH = "/tools/yaml-tools/";
export const YAML_TOOL_IDS = getInventoryIdsByCategory("yaml") as readonly string[];
export type YamlToolId = string;

export function buildYamlToolGridItems(t?: InventoryTranslator): ToolGridItem[] {
  return buildInventoryGridItems("yaml", t);
}

export function getYamlToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("yaml", t);
}
