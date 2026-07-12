import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const CROP_TOOL_IDS = ["crop-image", "resize-image", "favicon-cropper"] as const;

export const CROP_TOOLS_HUB_PATH = "/tools/crop-tools/";

export type CropToolId = (typeof CROP_TOOL_IDS)[number];

const CROP_TOOL_MESSAGE_KEYS: Record<CropToolId, string> = {
  "crop-image": "cropImage",
  "resize-image": "aspectRatioCrop",
  "favicon-cropper": "circleCrop",
};

type CropToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildCropToolGridItems(t?: CropToolsTranslator): ToolGridItem[] {
  return CROP_TOOL_IDS.map((id) => {
    const messageKey = CROP_TOOL_MESSAGE_KEYS[id];
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

export function getCropToolFeatureLabels(t?: CropToolsTranslator): string[] {
  return buildCropToolGridItems(t).map((item) => item.label);
}
