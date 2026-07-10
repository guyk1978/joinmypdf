import { resolveHomeToolCopy } from "@/lib/home-tool-copy";

export type HomeProductivityToolId =
  | "unit-converter"
  | "timezone-converter"
  | "word-character-counter"
  | "reading-time-calculator"
  | "case-converter";

export type HomeProductivityToolIconKey =
  | "scale"
  | "clock"
  | "letter-text"
  | "book-open"
  | "file-type-2";

export type HomeProductivityToolItem = {
  id: HomeProductivityToolId;
  href: string;
  label: string;
  description: string;
  iconKey: HomeProductivityToolIconKey;
};

const PRODUCTIVITY_TOOL_META: Record<
  HomeProductivityToolId,
  { iconKey: HomeProductivityToolIconKey; messageKey: string }
> = {
  "unit-converter": { iconKey: "scale", messageKey: "unitConverter" },
  "timezone-converter": { iconKey: "clock", messageKey: "timezoneConverter" },
  "word-character-counter": { iconKey: "letter-text", messageKey: "wordCharacterCounter" },
  "reading-time-calculator": { iconKey: "book-open", messageKey: "readingTimeCalculator" },
  "case-converter": { iconKey: "file-type-2", messageKey: "caseConverter" },
};

const PRODUCTIVITY_ITEMS_NS = "productivityTools";

export const HOME_PRODUCTIVITY_TOOL_IDS = Object.keys(
  PRODUCTIVITY_TOOL_META,
) as HomeProductivityToolId[];

export const HOMEPAGE_FEATURED_PRODUCTIVITY_IDS = HOME_PRODUCTIVITY_TOOL_IDS;

export type HomeFeaturedProductivityItem = {
  id: HomeProductivityToolId;
  href: string;
  label: string;
  iconKey: HomeProductivityToolIconKey;
};

type HomeTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export function buildHomepageFeaturedProductivityItems(
  tHome: HomeTranslator,
): HomeFeaturedProductivityItem[] {
  return HOMEPAGE_FEATURED_PRODUCTIVITY_IDS.map((id) => {
    const meta = PRODUCTIVITY_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, PRODUCTIVITY_ITEMS_NS, meta.messageKey, "label", id),
      iconKey: meta.iconKey,
    };
  });
}

export function buildHomeProductivityToolItems(tHome: HomeTranslator): HomeProductivityToolItem[] {
  return HOME_PRODUCTIVITY_TOOL_IDS.map((id) => {
    const meta = PRODUCTIVITY_TOOL_META[id];
    return {
      id,
      href: `/tools/${id}/`,
      label: resolveHomeToolCopy(tHome, PRODUCTIVITY_ITEMS_NS, meta.messageKey, "label", id),
      description: resolveHomeToolCopy(tHome, PRODUCTIVITY_ITEMS_NS, meta.messageKey, "description", id),
      iconKey: meta.iconKey,
    };
  });
}
