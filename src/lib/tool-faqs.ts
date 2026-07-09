import type { ToolDefinition, ToolFaq, ToolVariant } from "./types";
import type { ToolPageTranslator } from "./i18n-tool-page";

export const MIN_TOOL_FAQ_COUNT = 10;

const UNIVERSAL_FAQ_KEYS = [
  "free",
  "upload",
  "watermark",
  "mobile",
  "limits",
  "browser",
  "offline",
  "account",
  "retention",
  "formats",
  "errors",
  "security",
] as const;

function dedupeFaqs(faqs: ToolFaq[]): ToolFaq[] {
  const seen = new Set<string>();
  return faqs.filter((item) => {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildUniversalFaqs(t: ToolPageTranslator, toolTitle: string): ToolFaq[] {
  return UNIVERSAL_FAQ_KEYS.map((id) => ({
    q: t(`faqs.${id}Q`, { toolTitle }),
    a: t(`faqs.${id}A`, { toolTitle }),
  }));
}

function buildVariantFaqs(
  t: ToolPageTranslator,
  tool: ToolDefinition,
  variant: ToolVariant,
  toolTitle: string,
): ToolFaq[] {
  const angle = variant.angle || t("faqs.variantAngleDefault");
  return [
    { q: t("faqs.variantSameQ", { toolTitle }), a: t("faqs.variantSameA") },
    { q: t("faqs.variantKeywordQ", { keyword: variant.keyword }), a: angle },
    { q: t("faqs.variantBackendQ"), a: t("faqs.variantBackendA") },
    {
      q: t("faqs.variantMainPageQ", { toolTitle }),
      a: t("faqs.variantMainPageA", { slug: tool.slug }),
    },
  ];
}

const FALLBACK_TOOL_FAQ_IDS = ["whatIs", "privacy", "howItWorks", "whoFor"] as const;

function buildTranslatedToolFaqsFallback(
  t: ToolPageTranslator,
  toolTitle: string,
  intent: string,
  primaryKeyword: string,
): ToolFaq[] {
  return FALLBACK_TOOL_FAQ_IDS.map((id) => ({
    q: t(`toolFaqs.fallback.${id}Q`, { toolTitle }),
    a: t(`toolFaqs.fallback.${id}A`, { toolTitle, intent, primaryKeyword }),
  }));
}

/** Tool-specific FAQs from tools.json with per-locale strings or a translated fallback set. */
export function getFaqsForTool(
  tool: ToolDefinition,
  locale: string,
  t?: ToolPageTranslator,
  toolTitle?: string,
): ToolFaq[] {
  const english = tool.faq ?? [];
  if (!english.length) return [];
  if (locale === "en" || !t) return english;

  const title = toolTitle ?? tool.title;
  let localizedCount = 0;
  const localized = english.map((item, index) => {
    const qKey = `toolFaqs.${tool.slug}.${index}.q`;
    const aKey = `toolFaqs.${tool.slug}.${index}.a`;
    if (t.has(qKey) && t.has(aKey)) {
      localizedCount += 1;
      return { q: t(qKey), a: t(aKey) };
    }
    return item;
  });

  if (localizedCount === english.length) return localized;
  if (localizedCount > 0) return localized;

  return buildTranslatedToolFaqsFallback(t, title, tool.intent, tool.primaryKeyword);
}

export function buildLocalizedToolFaqs(
  t: ToolPageTranslator,
  tool: ToolDefinition,
  variant: ToolVariant | null,
  toolTitle: string,
  locale: string,
): ToolFaq[] {
  const universal = buildUniversalFaqs(t, toolTitle);

  if (variant) {
    return dedupeFaqs([...buildVariantFaqs(t, tool, variant, toolTitle), ...universal]).slice(
      0,
      Math.max(MIN_TOOL_FAQ_COUNT, universal.length + 4),
    );
  }

  const specific = getFaqsForTool(tool, locale, t, toolTitle);
  const merged = dedupeFaqs([...specific, ...universal]);
  return merged;
}
