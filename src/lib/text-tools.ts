import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const TEXT_TOOL_IDS = [
  "case-converter",
  "word-character-counter",
  "text-diff-checker",
  "string-generator",
  "reading-time-calculator",
  "html-markdown-converter",
  "base64-encoder-decoder",
  "url-encoder-decoder",
] as const;

export const TEXT_TOOLS_HUB_PATH = "/tools/text-tools/";

export type TextToolId = (typeof TEXT_TOOL_IDS)[number];

const TEXT_TOOL_MESSAGE_KEYS: Record<TextToolId, string> = {
  "case-converter": "caseConverter",
  "word-character-counter": "wordCharacterCounter",
  "text-diff-checker": "textDiffChecker",
  "string-generator": "stringGenerator",
  "reading-time-calculator": "readingTimeCalculator",
  "html-markdown-converter": "htmlMarkdownConverter",
  "base64-encoder-decoder": "base64EncoderDecoder",
  "url-encoder-decoder": "urlEncoderDecoder",
};

type TextToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildTextToolGridItems(t?: TextToolsTranslator): ToolGridItem[] {
  return TEXT_TOOL_IDS.map((id) => {
    const messageKey = TEXT_TOOL_MESSAGE_KEYS[id];
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

export function getTextToolFeatureLabels(t?: TextToolsTranslator): string[] {
  return buildTextToolGridItems(t).map((item) => item.label);
}
