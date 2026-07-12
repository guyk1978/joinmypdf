import { registry } from "@/lib/registry";

export type HomeTextJsonToolId =
  | "json-formatter"
  | "json-to-csv"
  | "json-minifier"
  | "csv-to-json"
  | "base64-encoder-decoder"
  | "url-encoder-decoder"
  | "text-diff-checker"
  | "text-diff"
  | "string-generator"
  | "html-markdown-converter"
  | "word-character-counter";

export type HomeTextJsonToolIconKey =
  | "braces"
  | "table"
  | "minimize-2"
  | "file-json"
  | "binary"
  | "link"
  | "git-compare"
  | "dices"
  | "code-xml"
  | "letter-text";

export type HomeTextJsonToolItem = {
  id: HomeTextJsonToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeTextJsonToolIconKey;
};

const TEXT_JSON_TOOL_META: Record<
  HomeTextJsonToolId,
  { iconKey: HomeTextJsonToolIconKey; messageKey: string }
> = {
  "json-formatter": { iconKey: "braces", messageKey: "jsonFormatter" },
  "json-to-csv": { iconKey: "table", messageKey: "jsonToCsv" },
  "json-minifier": { iconKey: "minimize-2", messageKey: "jsonMinifier" },
  "csv-to-json": { iconKey: "file-json", messageKey: "csvToJson" },
  "base64-encoder-decoder": { iconKey: "binary", messageKey: "base64EncoderDecoder" },
  "url-encoder-decoder": { iconKey: "link", messageKey: "urlEncoderDecoder" },
  "text-diff-checker": { iconKey: "git-compare", messageKey: "textDiffChecker" },
  "text-diff": { iconKey: "git-compare", messageKey: "textDiff" },
  "string-generator": { iconKey: "dices", messageKey: "stringGenerator" },
  "html-markdown-converter": { iconKey: "code-xml", messageKey: "htmlMarkdownConverter" },
  "word-character-counter": { iconKey: "letter-text", messageKey: "wordCharacterCounter" },
};

export const HOME_TEXT_JSON_TOOL_IDS = Object.keys(TEXT_JSON_TOOL_META) as HomeTextJsonToolId[];

/** Homepage — featured text & JSON tools */
export const HOMEPAGE_FEATURED_TEXT_JSON_IDS = ["json-formatter", "json-to-csv"] as const;

export type HomeFeaturedTextJsonItem = {
  id: HomeTextJsonToolId;
  href: string;
  label: string;
  iconKey: HomeTextJsonToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function isMissingHomeTranslation(value: string, messageKey: string, field: "label" | "description"): boolean {
  if (!value) return true;
  const leaf = `textJsonTools.items.${messageKey}.${field}`;
  if (value === leaf) return true;
  return value.includes("textJsonTools.items.") && value.endsWith(`.${field}`);
}

function resolveTextJsonToolCopy(
  tHome: HomeTranslator,
  id: HomeTextJsonToolId,
  messageKey: string,
  field: "label" | "description",
): string {
  const key = `textJsonTools.items.${messageKey}.${field}`;
  const translated = tHome.has(key) ? tHome(key) : "";
  if (!isMissingHomeTranslation(translated, messageKey, field)) {
    return translated;
  }

  const tool = registry.tools.find((entry) => entry.slug === id);
  if (field === "label" && tool?.title) return tool.title;
  if (field === "description" && tool?.description) return tool.description;
  return translated;
}

export function isHomeTextJsonToolId(id: string): id is HomeTextJsonToolId {
  return (HOME_TEXT_JSON_TOOL_IDS as readonly string[]).includes(id);
}

export function buildHomepageFeaturedTextJsonItems(
  tHome: HomeTranslator,
): HomeFeaturedTextJsonItem[] {
  return HOMEPAGE_FEATURED_TEXT_JSON_IDS.map((id) => {
    const meta = TEXT_JSON_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveTextJsonToolCopy(tHome, id, meta.messageKey, "label"),
      iconKey: meta.iconKey,
    };
  });
}

export function buildHomeTextJsonToolItems(tHome: HomeTranslator): HomeTextJsonToolItem[] {
  return HOME_TEXT_JSON_TOOL_IDS.map((id) => {
    const meta = TEXT_JSON_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveTextJsonToolCopy(tHome, id, meta.messageKey, "label"),
      description: resolveTextJsonToolCopy(tHome, id, meta.messageKey, "description"),
      iconKey: meta.iconKey,
    };
  });
}
