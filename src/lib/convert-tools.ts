import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const CONVERT_TOOLS_HUB_PATH = "/tools/convert-tools/";

export type ConvertToolGroupId = "document" | "image" | "media" | "data";

function partitionConvertIds(): Record<ConvertToolGroupId, string[]> {
  const all = getInventoryIdsByCategory("convert");
  const document: string[] = [];
  const image: string[] = [];
  const media: string[] = [];
  const data: string[] = [];

  for (const id of all) {
    if (
      id.includes("video") ||
      id.includes("mp3") ||
      id.includes("mp4") ||
      id.includes("wav") ||
      id.includes("flac") ||
      id.includes("ogg") ||
      id.includes("m4a") ||
      id.includes("audio")
    ) {
      media.push(id);
    } else if (
      id.includes("jpg") ||
      id.includes("png") ||
      id.includes("webp") ||
      id.includes("heic") ||
      id.includes("svg") ||
      id.includes("image") ||
      id === "convert-to-png"
    ) {
      image.push(id);
    } else if (
      id.includes("json") ||
      id.includes("yaml") ||
      id.includes("csv") ||
      id.includes("xml") ||
      id.includes("markdown") ||
      id.includes("html-markdown")
    ) {
      data.push(id);
    } else {
      document.push(id);
    }
  }

  return { document, image, media, data };
}

export const CONVERT_TOOL_GROUPS: {
  id: ConvertToolGroupId;
}[] = [
  { id: "document" },
  { id: "image" },
  { id: "media" },
  { id: "data" },
];

export const CONVERT_TOOL_IDS = getInventoryIdsByCategory("convert");

export type ConvertToolId = string;

/** @deprecated Popular shortcuts removed to avoid duplicate listings. */
export const CONVERT_POPULAR_IDS = [] as const;

export function buildConvertPopularItems(_t?: InventoryTranslator): ToolGridItem[] {
  return [];
}

export function buildConvertToolGroupItems(
  groupId: ConvertToolGroupId,
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  const ids = partitionConvertIds()[groupId];
  return buildInventoryGridItemsForIds(ids, t, "convert", locale);
}

export function buildConvertToolGridItems(t?: InventoryTranslator, locale?: string): ToolGridItem[] {
  return buildInventoryGridItems("convert", t, locale);
}

export function getConvertToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("convert", t);
}
