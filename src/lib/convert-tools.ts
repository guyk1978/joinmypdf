import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const CONVERT_TOOLS_HUB_PATH = "/tools/convert-tools/";

/**
 * Hub mini-categories on /tools/convert-tools/:
 * - document → PDF Conversion
 * - image → Image Conversion
 * - media → Video & Audio Conversion
 * - data → Data & Document Conversion
 */
export type ConvertToolGroupId = "document" | "image" | "media" | "data";

/** Explicit data/document conversions (not PDF-centric office converters). */
const DATA_IDS = new Set([
  "csv-to-json",
  "csv-to-markdown-table",
  "eml-to-pdf",
  "html-markdown-converter",
  "json-to-csv",
  "sql-query-formatter",
  "yaml-json-converter",
]);

/** Image format converters (including image → PDF). */
const IMAGE_IDS = new Set([
  "convert-to-png",
  "heic-to-jpg",
  "heic-to-pdf",
  "ico-to-png",
  "image-converter",
  "image-dpi-converter",
  "jpg-to-pdf",
  "png-to-ico",
  "png-to-pdf",
  "svg-to-favicon",
  "svg-to-png",
  "webp-to-jpg",
]);

function isMediaConvertId(id: string): boolean {
  return (
    id.includes("video") ||
    id.includes("mp3") ||
    id.includes("mp4") ||
    id.includes("wav") ||
    id.includes("flac") ||
    id.includes("ogg") ||
    id.includes("m4a") ||
    id.includes("audio") ||
    id.endsWith("-to-gif") ||
    id.includes("to-gif")
  );
}

function isDataConvertId(id: string): boolean {
  if (DATA_IDS.has(id)) return true;
  // Office/markdown/html → PDF stay under PDF Conversion.
  if (id.endsWith("-to-pdf") || id.startsWith("pdf-")) return false;
  return (
    id.includes("json") ||
    id.includes("yaml") ||
    id.includes("csv") ||
    id.includes("xml") ||
    id.includes("sql") ||
    id.includes("html-markdown")
  );
}

function isImageConvertId(id: string): boolean {
  if (IMAGE_IDS.has(id)) return true;
  // PDF → image / extract-from-PDF stay under PDF Conversion.
  if (id.startsWith("pdf-to-") || id.startsWith("extract-")) return false;
  return (
    id.includes("jpg") ||
    id.includes("png") ||
    id.includes("webp") ||
    id.includes("heic") ||
    id.includes("svg") ||
    id.includes("ico") ||
    id.includes("image") ||
    id === "convert-to-png"
  );
}

function partitionConvertIds(): Record<ConvertToolGroupId, string[]> {
  const all = getInventoryIdsByCategory("convert");
  const document: string[] = [];
  const image: string[] = [];
  const media: string[] = [];
  const data: string[] = [];

  for (const id of all) {
    if (isMediaConvertId(id)) media.push(id);
    else if (isDataConvertId(id)) data.push(id);
    else if (isImageConvertId(id)) image.push(id);
    else document.push(id);
  }

  return { document, image, media, data };
}

export const CONVERT_TOOL_GROUPS: {
  id: ConvertToolGroupId;
  get toolIds(): string[];
}[] = [
  { id: "document", get toolIds() { return partitionConvertIds().document; } },
  { id: "image", get toolIds() { return partitionConvertIds().image; } },
  { id: "media", get toolIds() { return partitionConvertIds().media; } },
  { id: "data", get toolIds() { return partitionConvertIds().data; } },
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
