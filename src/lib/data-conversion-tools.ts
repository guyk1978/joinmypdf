import { resolveHomeToolCopy } from "@/lib/home-tool-copy";

export type HomeDataConversionToolId =
  | "yaml-json-converter"
  | "csv-to-markdown-table"
  | "sql-query-formatter";

export type HomeDataConversionToolIconKey = "arrow-left-right" | "table" | "database";

export type HomeDataConversionToolItem = {
  id: HomeDataConversionToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeDataConversionToolIconKey;
};

const DATA_CONVERSION_TOOL_META: Record<
  HomeDataConversionToolId,
  { iconKey: HomeDataConversionToolIconKey; messageKey: string }
> = {
  "yaml-json-converter": { iconKey: "arrow-left-right", messageKey: "yamlJsonConverter" },
  "csv-to-markdown-table": { iconKey: "table", messageKey: "csvToMarkdownTable" },
  "sql-query-formatter": { iconKey: "database", messageKey: "sqlQueryFormatter" },
};

const DATA_CONVERSION_ITEMS_NS = "dataConversionTools";

export const HOME_DATA_CONVERSION_TOOL_IDS = Object.keys(
  DATA_CONVERSION_TOOL_META,
) as HomeDataConversionToolId[];

export const HOMEPAGE_FEATURED_DATA_CONVERSION_IDS = HOME_DATA_CONVERSION_TOOL_IDS;

export type HomeFeaturedDataConversionItem = {
  id: HomeDataConversionToolId;
  href: string;
  label: string;
  iconKey: HomeDataConversionToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomepageFeaturedDataConversionItems(
  tHome: HomeTranslator,
): HomeFeaturedDataConversionItem[] {
  return HOMEPAGE_FEATURED_DATA_CONVERSION_IDS.map((id) => {
    const meta = DATA_CONVERSION_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, DATA_CONVERSION_ITEMS_NS, meta.messageKey, "label", id),
      iconKey: meta.iconKey,
    };
  });
}

export function buildHomeDataConversionToolItems(tHome: HomeTranslator): HomeDataConversionToolItem[] {
  return HOME_DATA_CONVERSION_TOOL_IDS.map((id) => {
    const meta = DATA_CONVERSION_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, DATA_CONVERSION_ITEMS_NS, meta.messageKey, "label", id),
      description: resolveHomeToolCopy(tHome, DATA_CONVERSION_ITEMS_NS, meta.messageKey, "description", id),
      iconKey: meta.iconKey,
    };
  });
}
