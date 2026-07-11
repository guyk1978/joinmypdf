import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const JSON_TOOL_IDS = [
  "json-formatter",
  "json-minifier",
  "json-to-csv",
  "csv-to-json",
  "yaml-json-converter",
] as const;

export const JSON_TOOLS_HUB_PATH = "/tools/json-tools/";

export type JsonToolId = (typeof JSON_TOOL_IDS)[number];

const JSON_TOOL_MESSAGE_KEYS: Record<JsonToolId, string> = {
  "json-formatter": "jsonFormatter",
  "json-minifier": "jsonMinifier",
  "json-to-csv": "jsonToCsv",
  "csv-to-json": "csvToJson",
  "yaml-json-converter": "yamlJsonConverter",
};

type JsonToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildJsonToolGridItems(t?: JsonToolsTranslator): ToolGridItem[] {
  return JSON_TOOL_IDS.map((id) => {
    const messageKey = JSON_TOOL_MESSAGE_KEYS[id];
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

export function getJsonToolFeatureLabels(t?: JsonToolsTranslator): string[] {
  return buildJsonToolGridItems(t).map((item) => item.label);
}
