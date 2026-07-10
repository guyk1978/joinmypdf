import { getAudioToolById } from "@/lib/audio-tools";
import type { ToolGridItem } from "@/lib/tool-grid";

export const MP3_TOOL_IDS = ["mp3-converter", "audio-compressor", "mp3-compressor"] as const;

export const MP3_TOOLS_HUB_PATH = "/tools/mp3-tools/";

export type Mp3ToolId = (typeof MP3_TOOL_IDS)[number];

const MP3_TOOL_MESSAGE_KEYS: Record<Mp3ToolId, string> = {
  "mp3-converter": "mp3Converter",
  "audio-compressor": "audioCompressor",
  "mp3-compressor": "mp3Compressor",
};

type Mp3ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildMp3ToolGridItems(t?: Mp3ToolsTranslator): ToolGridItem[] {
  return MP3_TOOL_IDS.map((id) => {
    const messageKey = MP3_TOOL_MESSAGE_KEYS[id];
    const labelKey = `tools.${messageKey}`;
    const fallback = getAudioToolById(id)?.name ?? id;
    const label = t?.has(labelKey) ? t(labelKey) : fallback;

    return {
      href: `/tools/${id}/`,
      label,
      slugHint: id,
    };
  });
}

export function getMp3ToolFeatureLabels(t?: Mp3ToolsTranslator): string[] {
  return buildMp3ToolGridItems(t).map((item) => item.label);
}
