import { getAudioToolById } from "@/lib/audio-tools";
import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const VIDEO_TOOLS_HUB_PATH = "/tools/video-tools/";

export type VideoToolGroupId = "editing" | "conversion" | "optimization";

export type VideoHubToolId =
  | "video-resizer"
  | "video-rotator"
  | "video-speed-controller"
  | "video-to-gif"
  | "mp4-to-mp3"
  | "video-to-mp4"
  | "video-compressor";

export const VIDEO_TOOL_GROUPS: {
  id: VideoToolGroupId;
  toolIds: readonly VideoHubToolId[];
}[] = [
  {
    id: "editing",
    toolIds: ["video-resizer", "video-rotator", "video-speed-controller"],
  },
  {
    id: "conversion",
    toolIds: ["video-to-gif", "mp4-to-mp3", "video-to-mp4"],
  },
  {
    id: "optimization",
    toolIds: ["video-compressor"],
  },
];

export const VIDEO_HUB_TOOL_IDS = VIDEO_TOOL_GROUPS.flatMap((group) => [...group.toolIds]);

const VIDEO_TOOL_MESSAGE_KEYS: Record<VideoHubToolId, string> = {
  "video-resizer": "videoResizer",
  "video-rotator": "videoRotator",
  "video-speed-controller": "videoSpeedController",
  "video-to-gif": "videoToGif",
  "mp4-to-mp3": "mp4ToMp3",
  "video-to-mp4": "videoToMp4",
  "video-compressor": "videoCompressor",
};

/** Hub-facing labels for clearer conversion intents. */
const VIDEO_HUB_LABEL_OVERRIDES: Partial<Record<VideoHubToolId, string>> = {
  "mp4-to-mp3": "videoToMp3",
  "video-to-mp4": "mp4Converter",
};

type VideoToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return (
    registry.tools.find((tool) => tool.slug === slug)?.title ?? getAudioToolById(slug)?.name
  );
}

function resolveVideoToolLabel(id: VideoHubToolId, t?: VideoToolsTranslator): string {
  const overrideKey = VIDEO_HUB_LABEL_OVERRIDES[id];
  if (overrideKey) {
    const hubKey = `tools.${overrideKey}`;
    if (t?.has(hubKey)) return t(hubKey);
  }

  const messageKey = VIDEO_TOOL_MESSAGE_KEYS[id];
  const labelKey = `tools.${messageKey}`;
  const fallback = getToolTitle(id) ?? id;
  return t?.has(labelKey) ? t(labelKey) : fallback;
}

export function buildVideoToolGridItem(
  id: VideoHubToolId,
  t?: VideoToolsTranslator,
): ToolGridItem {
  return {
    href: `/tools/${id}/`,
    label: resolveVideoToolLabel(id, t),
    slugHint: id,
  };
}

export function buildVideoToolGroupItems(
  groupId: VideoToolGroupId,
  t?: VideoToolsTranslator,
): ToolGridItem[] {
  const group = VIDEO_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.toolIds.map((id) => buildVideoToolGridItem(id, t));
}

export function getVideoToolFeatureLabels(t?: VideoToolsTranslator): string[] {
  const labels = VIDEO_HUB_TOOL_IDS.map((id) => resolveVideoToolLabel(id, t));
  return ["Video Processing", ...labels];
}
