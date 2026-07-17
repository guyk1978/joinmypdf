import { VIDEO_TOOLS_INVENTORY_IDS } from "@/data/tools-inventory";
import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  getInventoryIdsByCategory,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";

export const VIDEO_TOOLS_HUB_PATH = "/tools/video-tools/";

export type VideoToolGroupId = "editing" | "conversion" | "optimization";

const EDITING = [
  "video-trimmer",
  "video-muter",
  "video-metadata-cleaner",
  "video-speed",
  "video-resizer",
  "video-rotator",
  "video-speed-controller",
] as const;

const CONVERSION = [
  "video-converter",
  "video-to-gif",
  "video-to-mp3",
  "video-to-mp4",
  "mp4-to-mp3",
] as const;

const OPTIMIZATION = ["video-compressor"] as const;

export const VIDEO_TOOL_GROUPS: {
  id: VideoToolGroupId;
  toolIds: readonly string[];
}[] = [
  {
    id: "editing",
    toolIds: EDITING,
  },
  {
    id: "conversion",
    toolIds: [...CONVERSION],
  },
  {
    id: "optimization",
    toolIds: OPTIMIZATION,
  },
];

export const VIDEO_HUB_TOOL_IDS = VIDEO_TOOL_GROUPS.flatMap((group) => [...group.toolIds]);

export const CORE_VIDEO_HUB_IDS = VIDEO_TOOLS_INVENTORY_IDS;

export function buildVideoToolGroupItems(
  groupId: VideoToolGroupId,
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  const group = VIDEO_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];

  let ids = [...group.toolIds];
  if (groupId === "conversion") {
    const grouped = new Set(VIDEO_HUB_TOOL_IDS);
    const orphans = getInventoryIdsByCategory("video").filter((id) => !grouped.has(id));
    ids = [...ids, ...orphans];
  }

  return buildInventoryGridItemsForIds(ids, t, "video", locale);
}

export function buildVideoToolGridItems(t?: InventoryTranslator, locale?: string): ToolGridItem[] {
  return buildInventoryGridItems("video", t, locale);
}

export function getVideoToolFeatureLabels(t?: InventoryTranslator): string[] {
  return ["Video Processing", ...getInventoryFeatureLabels("video", t)];
}
