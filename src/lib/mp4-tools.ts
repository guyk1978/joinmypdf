import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";
import {
  VIDEO_TOOLS_INVENTORY,
  VIDEO_TOOLS_INVENTORY_IDS,
  type VideoToolsInventoryId,
} from "@/data/tools-inventory";

/** All 10 core video tools on the MP4 Tools hub. */
export const MP4_TOOL_IDS = VIDEO_TOOLS_INVENTORY_IDS;

export const MP4_TOOLS_HUB_PATH = "/tools/mp4-tools/";

export type Mp4ToolId = VideoToolsInventoryId;

const MP4_TOOL_MESSAGE_KEYS: Record<Mp4ToolId, string> = {
  "video-trimmer": "videoTrimmer",
  "video-to-gif": "videoToGif",
  "video-resizer": "videoResizer",
  "video-compressor": "videoCompressor",
  "video-to-mp3": "videoToMp3",
  "video-muter": "videoMuter",
  "video-speed": "videoSpeed",
  "video-rotator": "videoRotator",
  "video-metadata-cleaner": "videoMetadataCleaner",
  "video-converter": "videoConverter",
};

type Mp4ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  const inventoryTitle = VIDEO_TOOLS_INVENTORY.find((tool) => tool.id === slug)?.title;
  return inventoryTitle ?? registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildMp4ToolGridItems(t?: Mp4ToolsTranslator): ToolGridItem[] {
  return MP4_TOOL_IDS.map((id) => {
    const messageKey = MP4_TOOL_MESSAGE_KEYS[id];
    const labelKey = `tools.${messageKey}`;
    const fallback = getToolTitle(id) ?? id;
    const label = t?.has(labelKey) ? t(labelKey) : fallback;

    return {
      href: `/tools/${id}/`,
      label,
      slugHint: id,
    };
  });
}

export function getMp4ToolFeatureLabels(t?: Mp4ToolsTranslator): string[] {
  return buildMp4ToolGridItems(t).map((item) => item.label);
}

/** Breadcrumb trail: Home / All tools / MP4 Tools / [Tool Name] */
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
