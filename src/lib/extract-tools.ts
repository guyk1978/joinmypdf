import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const EXTRACT_TOOL_IDS = [
  "pdf-to-text",
  "extract-images",
  "extract-tables-pdf",
  "extract-pdf-pages",
] as const;

export const EXTRACT_TOOLS_HUB_PATH = "/tools/extract-tools/";

export type ExtractToolId = (typeof EXTRACT_TOOL_IDS)[number];

const EXTRACT_TOOL_MESSAGE_KEYS: Record<ExtractToolId, string> = {
  "pdf-to-text": "pdfToText",
  "extract-images": "extractImages",
  "extract-tables-pdf": "extractTablesPdf",
  "extract-pdf-pages": "extractPdfPages",
};

type ExtractToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildExtractToolGridItems(t?: ExtractToolsTranslator): ToolGridItem[] {
  return EXTRACT_TOOL_IDS.map((id) => {
    const messageKey = EXTRACT_TOOL_MESSAGE_KEYS[id];
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

export function getExtractToolFeatureLabels(t?: ExtractToolsTranslator): string[] {
  return buildExtractToolGridItems(t).map((item) => item.label);
}
