import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const MP4_TOOL_IDS = ["video-to-mp4", "video-compressor", "video-resizer"] as const;

export const MP4_TOOLS_HUB_PATH = "/tools/mp4-tools/";

export type Mp4ToolId = (typeof MP4_TOOL_IDS)[number];

const MP4_TOOL_MESSAGE_KEYS: Record<Mp4ToolId, string> = {
  "video-to-mp4": "videoToMp4",
  "video-compressor": "videoCompressor",
  "video-resizer": "videoResizer",
};

type Mp4ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
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
