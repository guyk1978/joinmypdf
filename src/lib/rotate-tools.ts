import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const ROTATE_TOOL_IDS = ["rotate-pdf", "rotate-image"] as const;

export const ROTATE_TOOLS_HUB_PATH = "/tools/rotate-tools/";

export type RotateToolId = (typeof ROTATE_TOOL_IDS)[number];

const ROTATE_TOOL_MESSAGE_KEYS: Record<RotateToolId, string> = {
  "rotate-pdf": "rotatePdf",
  "rotate-image": "rotateImage",
};

type RotateToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildRotateToolGridItems(t?: RotateToolsTranslator): ToolGridItem[] {
  return ROTATE_TOOL_IDS.map((id) => {
    const messageKey = ROTATE_TOOL_MESSAGE_KEYS[id];
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

export function getRotateToolFeatureLabels(t?: RotateToolsTranslator): string[] {
  return buildRotateToolGridItems(t).map((item) => item.label);
}
