import {
  buildInventoryGridItems,
  buildInventoryGridItemsForIds,
  getInventoryFeatureLabels,
  type InventoryTranslator,
} from "@/lib/tools-inventory-query";
import type { ToolGridItem } from "@/lib/tool-grid";
import { VIDEO_TOOLS_INVENTORY_IDS } from "@/data/tools-inventory";

/** All video-tagged tools on the MP4 Tools hub (same inventory membership). */
export const MP4_TOOL_IDS = VIDEO_TOOLS_INVENTORY_IDS;

export const MP4_TOOLS_HUB_PATH = "/tools/mp4-tools/";

export type Mp4ToolId = (typeof MP4_TOOL_IDS)[number];

export function buildMp4ToolGridItems(t?: InventoryTranslator, locale?: string): ToolGridItem[] {
  return buildInventoryGridItems("mp4", t, locale);
}

export function getMp4ToolFeatureLabels(t?: InventoryTranslator): string[] {
  return getInventoryFeatureLabels("mp4", t);
}

/**
 * @deprecated Prefer `buildToolPageBreadcrumbs` from `@/lib/tool-breadcrumb-hub`.
 */
export function buildMp4ToolPageCrumbs(params: {
  toolTitle: string;
  toolPath: string;
  labels: {
    home: string;
    allTools: string;
    mp4Tools: string;
  };
}): { name: string; path: string }[] {
  return [
    { name: params.labels.home, path: "/" },
    { name: params.labels.allTools, path: "/tools/" },
    { name: params.labels.mp4Tools, path: MP4_TOOLS_HUB_PATH },
    { name: params.toolTitle, path: params.toolPath },
  ];
}

export function buildMp4ToolGridItemsForIds(
  ids: readonly string[],
  t?: InventoryTranslator,
  locale?: string,
): ToolGridItem[] {
  return buildInventoryGridItemsForIds(ids, t, "mp4", locale);
}
