import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const YAML_TOOL_IDS = ["yaml-json-converter"] as const;

export const YAML_TOOLS_HUB_PATH = "/tools/yaml-tools/";

export type YamlToolId = (typeof YAML_TOOL_IDS)[number];

const YAML_TOOL_MESSAGE_KEYS: Record<YamlToolId, string> = {
  "yaml-json-converter": "yamlJsonConverter",
};

type YamlToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildYamlToolGridItems(t?: YamlToolsTranslator): ToolGridItem[] {
  return YAML_TOOL_IDS.map((id) => {
    const messageKey = YAML_TOOL_MESSAGE_KEYS[id];
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

export function getYamlToolFeatureLabels(t?: YamlToolsTranslator): string[] {
  return buildYamlToolGridItems(t).map((item) => item.label);
}
