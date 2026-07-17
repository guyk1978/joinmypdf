import {
  PDF_INVENTORY_SECTIONS,
  PDF_TOOLS_INVENTORY_IDS,
  type PdfInventorySectionId,
} from "@/data/tools-inventory";
import {
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const PDF_TOOLS_HUB_PATH = "/tools/pdf-tools/";

export type PdfToolGroupId = PdfInventorySectionId;

export const PDF_TOOL_GROUPS = PDF_INVENTORY_SECTIONS.map((section) => ({
  id: section.id as PdfToolGroupId,
  toolIds: section.toolIds,
}));

export const PDF_TOOL_IDS = [...PDF_TOOLS_INVENTORY_IDS];

export type PdfToolId = string;

export function buildPdfToolGroupItems(
  groupId: PdfToolGroupId,
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  const group = PDF_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  // Prefer Tools.* translator so items.<slug> / cardDescriptions localize correctly.
  return buildInventoryGridItemsForIds(group.toolIds, t, "pdf", locale);
}

export function getPdfToolFeatureLabels(t?: InventoryTranslator): string[] {
  return ["PDF Manipulation", ...getInventoryFeatureLabels("pdf", t)];
}
