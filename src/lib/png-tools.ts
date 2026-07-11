import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const PNG_TOOL_IDS = [
  "convert-to-png",
  "compress-image",
  "resize-image",
  "svg-to-png",
  "image-optimizer",
] as const;

export const PNG_TOOLS_HUB_PATH = "/tools/png-tools/";

export type PngToolId = (typeof PNG_TOOL_IDS)[number];

const PNG_TOOL_MESSAGE_KEYS: Record<PngToolId, string> = {
  "convert-to-png": "convertToPng",
  "compress-image": "compressImage",
  "resize-image": "resizeImage",
  "svg-to-png": "svgToPng",
  "image-optimizer": "imageOptimizer",
};

type PngToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildPngToolGridItems(t?: PngToolsTranslator): ToolGridItem[] {
  return PNG_TOOL_IDS.map((id) => {
    const messageKey = PNG_TOOL_MESSAGE_KEYS[id];
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

export function getPngToolFeatureLabels(t?: PngToolsTranslator): string[] {
  return buildPngToolGridItems(t).map((item) => item.label);
}
