import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const COMPRESS_TOOLS_HUB_PATH = "/tools/compress-tools/";

export type CompressToolGroupId = "image" | "media" | "document";

const IMAGE_IDS = new Set(["compress-image", "image-optimizer", "favicon-compressor"]);
const MEDIA_IDS = new Set([
  "video-compressor",
  "audio-compressor",
  "mp3-compressor",
]);
const DOCUMENT_IDS = new Set([
  "pdf-compress",
  "pdf-linearization",
  "flatten-pdf",
  "repair-pdf",
]);

function partitionCompressIds(): Record<CompressToolGroupId, string[]> {
  const all = getInventoryIdsByCategory("compress");
  const image: string[] = [];
  const media: string[] = [];
  const document: string[] = [];
  const other: string[] = [];

  for (const id of all) {
    if (IMAGE_IDS.has(id) || id.includes("image") || id.includes("favicon")) image.push(id);
    else if (MEDIA_IDS.has(id) || id.includes("video") || id.includes("audio") || id.includes("mp3")) {
      media.push(id);
    } else if (DOCUMENT_IDS.has(id) || id.includes("pdf")) document.push(id);
    else other.push(id);
  }

  // Keep leftover compress tools visible under document.
  return {
    image,
    media,
    document: [...document, ...other],
  };
}

export const COMPRESS_TOOL_GROUPS: {
  id: CompressToolGroupId;
  get toolIds(): string[];
}[] = [
  { id: "image", get toolIds() { return partitionCompressIds().image; } },
  { id: "media", get toolIds() { return partitionCompressIds().media; } },
  { id: "document", get toolIds() { return partitionCompressIds().document; } },
];

export const COMPRESS_TOOL_IDS = getInventoryIdsByCategory("compress");

export type CompressToolId = string;

export function buildCompressToolGroupItems(
  groupId: CompressToolGroupId,
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  const ids = partitionCompressIds()[groupId];
  return buildInventoryGridItemsForIds(ids, t, "compress", locale);
}

export function buildCompressToolGridItems(t?: InventoryTranslator, locale?: string): ToolGridItem[] {
  return buildInventoryGridItems("compress", t, locale);
}

export function getCompressToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("compress", t);
}
