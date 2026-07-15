import {
  TOOLS_INVENTORY,
  type InventoryCategoryId,
} from "@/data/tools-inventory";
import type { AllToolsGroupConfig } from "@/config/tools";

/** Map inventory primaryCategory → All Tools modal group. */
export const INVENTORY_PRIMARY_TO_MODAL_GROUP: Record<
  InventoryCategoryId,
  AllToolsGroupConfig["id"]
> = {
  convert: "convert",
  video: "convert",
  mp4: "convert",
  jpg: "convert",
  png: "convert",
  word: "convert",
  excel: "convert",
  data: "convert",
  yaml: "convert",
  xml: "convert",
  json: "convert",
  compress: "compress",
  crop: "resize",
  rotate: "resize",
  image: "resize",
  security: "security",
  pdf: "design",
  extract: "design",
  favicon: "design",
  developer: "design",
  text: "design",
  design: "design",
  productivity: "design",
  "unit-math": "design",
  mp3: "design",
  audio: "design",
};

/** Preferred modal column when appending inventory orphans. */
export const INVENTORY_PRIMARY_TO_MODAL_COLUMN: Record<InventoryCategoryId, string> = {
  convert: "inventory-more-convert",
  video: "video",
  mp4: "video",
  jpg: "image-formats",
  png: "image-formats",
  word: "pdf-to",
  excel: "pdf-to",
  data: "data-formats",
  yaml: "data-formats",
  xml: "data-formats",
  json: "data-formats",
  compress: "inventory-more-compress",
  crop: "image",
  rotate: "image",
  image: "image",
  security: "security-generators",
  pdf: "pdf-organize",
  extract: "pdf-from",
  favicon: "favicon",
  developer: "developer",
  text: "utilities",
  design: "design-tools",
  productivity: "utilities",
  "unit-math": "utilities",
  mp3: "utilities",
  audio: "utilities",
};

export function listInventorySlugsForModal(): string[] {
  return TOOLS_INVENTORY.map((tool) => tool.id);
}

export function getModalPlacementForInventorySlug(slug: string): {
  groupId: AllToolsGroupConfig["id"];
  columnId: string;
} | null {
  const entry = TOOLS_INVENTORY.find((tool) => tool.id === slug);
  if (!entry) return null;
  return {
    groupId: INVENTORY_PRIMARY_TO_MODAL_GROUP[entry.primaryCategory],
    columnId: INVENTORY_PRIMARY_TO_MODAL_COLUMN[entry.primaryCategory],
  };
}
