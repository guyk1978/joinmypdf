import { getAudioToolById } from "@/lib/audio-tools";
import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const COMPRESS_TOOLS_HUB_PATH = "/tools/compress-tools/";

export type CompressToolGroupId = "image" | "media" | "document";

export type CompressToolId =
  | "compress-image"
  | "image-optimizer"
  | "video-compressor"
  | "audio-compressor"
  | "pdf-compress";

export const COMPRESS_TOOL_GROUPS: {
  id: CompressToolGroupId;
  toolIds: readonly CompressToolId[];
}[] = [
  {
    id: "image",
    toolIds: ["compress-image", "image-optimizer"],
  },
  {
    id: "media",
    toolIds: ["video-compressor", "audio-compressor"],
  },
  {
    id: "document",
    toolIds: ["pdf-compress"],
  },
];

export const COMPRESS_TOOL_IDS = COMPRESS_TOOL_GROUPS.flatMap((group) => [...group.toolIds]);

const COMPRESS_TOOL_MESSAGE_KEYS: Record<CompressToolId, string> = {
  "compress-image": "compressImage",
  "image-optimizer": "imageOptimizer",
  "video-compressor": "videoCompressor",
  "audio-compressor": "audioCompressor",
  "pdf-compress": "compressPdf",
};

/** Hub-facing labels that distinguish JPG vs PNG compression intents. */
const COMPRESS_HUB_LABEL_OVERRIDES: Partial<Record<CompressToolId, string>> = {
  "compress-image": "jpgCompressor",
  "image-optimizer": "pngCompressor",
};

type CompressToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return (
    registry.tools.find((tool) => tool.slug === slug)?.title ?? getAudioToolById(slug)?.name
  );
}

function resolveCompressToolLabel(id: CompressToolId, t?: CompressToolsTranslator): string {
  const overrideKey = COMPRESS_HUB_LABEL_OVERRIDES[id];
  if (overrideKey) {
    const hubKey = `tools.${overrideKey}`;
    if (t?.has(hubKey)) return t(hubKey);
  }

  const messageKey = COMPRESS_TOOL_MESSAGE_KEYS[id];
  const labelKey = `tools.${messageKey}`;
  const fallback = getToolTitle(id) ?? id;
  return t?.has(labelKey) ? t(labelKey) : fallback;
}

export function buildCompressToolGridItem(
  id: CompressToolId,
  t?: CompressToolsTranslator,
): ToolGridItem {
  return {
    href: `/tools/${id}/`,
    label: resolveCompressToolLabel(id, t),
    slugHint: id,
  };
}

export function buildCompressToolGroupItems(
  groupId: CompressToolGroupId,
  t?: CompressToolsTranslator,
): ToolGridItem[] {
  const group = COMPRESS_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.toolIds.map((id) => buildCompressToolGridItem(id, t));
}

export function getCompressToolFeatureLabels(t?: CompressToolsTranslator): string[] {
  return COMPRESS_TOOL_IDS.map((id) => resolveCompressToolLabel(id, t));
}
