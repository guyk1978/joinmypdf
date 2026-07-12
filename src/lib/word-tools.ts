import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const WORD_TOOL_IDS = ["word-to-pdf", "pdf-to-word", "word-character-counter"] as const;

export const WORD_TOOLS_HUB_PATH = "/tools/word-tools/";

export type WordToolId = (typeof WORD_TOOL_IDS)[number];

const WORD_TOOL_MESSAGE_KEYS: Record<WordToolId, string> = {
  "word-to-pdf": "wordToPdf",
  "pdf-to-word": "pdfToWord",
  "word-character-counter": "wordCharacterCounter",
};

type WordToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildWordToolGridItems(t?: WordToolsTranslator): ToolGridItem[] {
  return WORD_TOOL_IDS.map((id) => {
    const messageKey = WORD_TOOL_MESSAGE_KEYS[id];
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

export function getWordToolFeatureLabels(t?: WordToolsTranslator): string[] {
  return buildWordToolGridItems(t).map((item) => item.label);
}
