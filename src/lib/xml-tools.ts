import type { ToolGridItem } from "@/lib/tool-grid";

/** XML utility tools — expand as dedicated XML converters ship. */
export const XML_TOOL_IDS = [] as const;

export const XML_TOOLS_HUB_PATH = "/tools/xml-tools/";

type XmlToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildXmlToolGridItems(_t?: XmlToolsTranslator): ToolGridItem[] {
  return [];
}

export function getXmlToolFeatureLabels(t?: XmlToolsTranslator): string[] {
  if (t?.has("schemaName")) return [t("schemaName")];
  return ["XML Tools"];
}
