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

  const specific = locale === "en" && tool.faq?.length ? tool.faq : [];
  const merged = dedupeFaqs([...specific, ...universal]);
  return merged;
}
