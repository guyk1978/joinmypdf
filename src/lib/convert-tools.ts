import { getAudioToolById } from "@/lib/audio-tools";
import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const CONVERT_TOOLS_HUB_PATH = "/tools/convert-tools/";

export type ConvertToolGroupId = "document" | "image" | "media";

export type ConvertToolId =
  | "pdf-to-word"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "powerpoint-to-pdf"
  | "csv-to-json"
  | "json-to-csv"
  | "yaml-json-converter"
  | "convert-to-png"
  | "heic-to-jpg"
  | "webp-to-jpg"
  | "jpg-to-pdf"
  | "png-to-pdf"
  | "pdf-to-jpg"
  | "mp4-to-mp3"
  | "video-to-mp4"
  | "video-converter"
  | "video-to-gif"
  | "wav-to-mp3";

/** High-CTR shortcuts shown above the full grouped lists. */
export const CONVERT_POPULAR_IDS = [
  "pdf-to-word",
  "word-to-pdf",
  "jpg-to-pdf",
  "mp4-to-mp3",
] as const satisfies readonly ConvertToolId[];

export const CONVERT_TOOL_GROUPS: {
  id: ConvertToolGroupId;
  toolIds: readonly ConvertToolId[];
}[] = [
  {
    id: "document",
    toolIds: [
      "pdf-to-word",
      "word-to-pdf",
      "excel-to-pdf",
      "powerpoint-to-pdf",
      "csv-to-json",
      "json-to-csv",
      "yaml-json-converter",
    ],
  },
  {
    id: "image",
    toolIds: [
      "convert-to-png",
      "heic-to-jpg",
      "webp-to-jpg",
      "jpg-to-pdf",
      "png-to-pdf",
      "pdf-to-jpg",
    ],
  },
  {
    id: "media",
    toolIds: ["mp4-to-mp3", "video-to-mp4", "video-converter", "video-to-gif", "wav-to-mp3"],
  },
];

export const CONVERT_TOOL_IDS = [
  ...new Set([
    ...CONVERT_POPULAR_IDS,
    ...CONVERT_TOOL_GROUPS.flatMap((group) => [...group.toolIds]),
  ]),
] as ConvertToolId[];

const CONVERT_TOOL_MESSAGE_KEYS: Record<ConvertToolId, string> = {
  "pdf-to-word": "pdfToWord",
  "word-to-pdf": "wordToPdf",
  "excel-to-pdf": "excelToPdf",
  "powerpoint-to-pdf": "powerpointToPdf",
  "csv-to-json": "csvToJson",
  "json-to-csv": "jsonToCsv",
  "yaml-json-converter": "yamlJsonConverter",
  "convert-to-png": "convertToPng",
  "heic-to-jpg": "heicToJpg",
  "webp-to-jpg": "webpToJpg",
  "jpg-to-pdf": "jpgToPdf",
  "png-to-pdf": "pngToPdf",
  "pdf-to-jpg": "pdfToJpg",
  "mp4-to-mp3": "mp4ToMp3",
  "video-to-mp4": "videoToMp4",
  "video-converter": "videoConverter",
  "video-to-gif": "videoToGif",
  "wav-to-mp3": "wavToMp3",
};

/** Hub-facing labels for clearer conversion intents. */
const CONVERT_HUB_LABEL_OVERRIDES: Partial<Record<ConvertToolId, string>> = {
  "convert-to-png": "jpgToPng",
  "jpg-to-pdf": "jpgToPdf",
  "mp4-to-mp3": "mp4ToMp3",
};

type ConvertToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return (
    registry.tools.find((tool) => tool.slug === slug)?.title ?? getAudioToolById(slug)?.name
  );
}

function resolveConvertToolLabel(id: ConvertToolId, t?: ConvertToolsTranslator): string {
  const overrideKey = CONVERT_HUB_LABEL_OVERRIDES[id];
  if (overrideKey) {
    const hubKey = `tools.${overrideKey}`;
    if (t?.has(hubKey)) return t(hubKey);
  }

  const messageKey = CONVERT_TOOL_MESSAGE_KEYS[id];
  const labelKey = `tools.${messageKey}`;
  const fallback = getToolTitle(id) ?? id;
  return t?.has(labelKey) ? t(labelKey) : fallback;
}

export function buildConvertToolGridItem(
  id: ConvertToolId,
  t?: ConvertToolsTranslator,
  slugHintSuffix?: string,
): ToolGridItem {
  return {
    href: `/tools/${id}/`,
    label: resolveConvertToolLabel(id, t),
    slugHint: slugHintSuffix ? `${id}-${slugHintSuffix}` : id,
  };
}

export function buildConvertPopularItems(t?: ConvertToolsTranslator): ToolGridItem[] {
  return CONVERT_POPULAR_IDS.map((id) => buildConvertToolGridItem(id, t, "popular"));
}

export function buildConvertToolGroupItems(
  groupId: ConvertToolGroupId,
  t?: ConvertToolsTranslator,
): ToolGridItem[] {
  const group = CONVERT_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.toolIds.map((id) => buildConvertToolGridItem(id, t));
}

export function getConvertToolFeatureLabels(t?: ConvertToolsTranslator): string[] {
  return CONVERT_TOOL_IDS.map((id) => resolveConvertToolLabel(id, t));
}
