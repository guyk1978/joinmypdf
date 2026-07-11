import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const JPG_TOOL_IDS = [
  "compress-image",
  "convert-to-png",
  "heic-to-jpg",
  "webp-to-jpg",
  "resize-image",
  "image-optimizer",
  "crop-image",
  "jpg-to-pdf",
] as const;

export const JPG_TOOLS_HUB_PATH = "/tools/jpg-tools/";

export type JpgToolId = (typeof JPG_TOOL_IDS)[number];

const JPG_TOOL_MESSAGE_KEYS: Record<JpgToolId, string> = {
  "compress-image": "compressImage",
  "convert-to-png": "convertToPng",
  "heic-to-jpg": "heicToJpg",
  "webp-to-jpg": "webpToJpg",
  "resize-image": "resizeImage",
  "image-optimizer": "imageOptimizer",
  "crop-image": "cropImage",
  "jpg-to-pdf": "jpgToPdf",
};

type JpgToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildJpgToolGridItems(t?: JpgToolsTranslator): ToolGridItem[] {
  return JPG_TOOL_IDS.map((id) => {
    const messageKey = JPG_TOOL_MESSAGE_KEYS[id];
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

export function getJpgToolFeatureLabels(t?: JpgToolsTranslator): string[] {
  return buildJpgToolGridItems(t).map((item) => item.label);
}
