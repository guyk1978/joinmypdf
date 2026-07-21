import { getToolRealWorldExample } from "@/data/tool-real-world-examples";
import { registry } from "@/lib/registry";
import { normalizeToolNameForDocH1 } from "@/lib/tool-doc-h1";

export type ToolDocBodyContent = {
  overviewParagraphs: string[];
  howItWorksParagraphs: string[];
  realWorldExample: { heading: string; body: string } | null;
  useCases: string[];
  whyItMatters: string | null;
};

/** Locale-aware sentence templates used to enrich DOC copy without English leaks. */
export type ToolDocSynthesisTemplates = {
  overviewExpand1: string;
  overviewExpand2: string;
  howItWorksSteps: string;
  howItWorksPrivacy: string;
  realWorldFallback: string;
  useCaseDeadline: string;
  useCasePrivate: string;
  useCaseShare: string;
  realWorldHeading: string;
  whyYouNeedThisHeading: string;
};

type ToolsTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

function normalizeProse(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function proseKey(value: string): string {
  return value.toLowerCase();
}

function uniqueParagraphs(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = normalizeProse(value);
    if (!text) continue;
    const key = proseKey(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function fillToolName(template: string, toolName: string): string {
  return template.replace(/\{toolName\}/g, toolName).replace(/\s+/g, " ").trim();
}

function synthesizeHowItWorks(
  toolName: string,
  intent: string | undefined,
  templates: ToolDocSynthesisTemplates,
): string[] {
  const paragraphs: string[] = [];
  if (intent) paragraphs.push(intent);

  paragraphs.push(fillToolName(templates.howItWorksSteps, toolName));
  paragraphs.push(fillToolName(templates.howItWorksPrivacy, toolName));

  return uniqueParagraphs(paragraphs);
}

function synthesizeOverview(
  toolName: string,
  description: string | undefined,
  intent: string | undefined,
  templates: ToolDocSynthesisTemplates,
): string[] {
  const paragraphs = uniqueParagraphs([description, intent]);

  if (paragraphs.join(" ").length < 160) {
    paragraphs.push(fillToolName(templates.overviewExpand1, toolName));
  }

  if (paragraphs.join(" ").length < 280) {
    paragraphs.push(fillToolName(templates.overviewExpand2, toolName));
  }

  return uniqueParagraphs(paragraphs);
}

function synthesizeUseCases(
  toolName: string,
  templates: ToolDocSynthesisTemplates,
): string[] {
  return uniqueParagraphs([
    fillToolName(templates.useCaseDeadline, toolName),
    fillToolName(templates.useCasePrivate, toolName),
    fillToolName(templates.useCaseShare, toolName),
  ]);
}

/**
 * Resolve DOC fields from i18n first. Never fall back to English registry
 * prose when `locale !== "en"`.
 */
export function resolveLocalizedToolDocFields(params: {
  slug: string;
  locale: string;
  tTools: ToolsTranslator;
  title?: string | null;
  description?: string | null;
  intent?: string | null;
  whyItMatters?: string | null;
  useCases?: string[] | null;
}): {
  title: string;
  description: string;
  intent: string;
  whyItMatters: string | null;
  useCases: string[];
  primaryKeyword: string | null;
} {
  const { slug, locale, tTools } = params;
  const tool = registry.tools.find((entry) => entry.slug === slug);
  const isEnglish = locale === "en";

  const title =
    (tTools.has(`items.${slug}`) ? normalizeProse(tTools(`items.${slug}`)) : "") ||
    normalizeProse(params.title) ||
    normalizeProse(tool?.title) ||
    slug;

  const cardDescription = tTools.has(`cardDescriptions.${slug}`)
    ? normalizeProse(tTools(`cardDescriptions.${slug}`))
    : "";
  const description = isEnglish
    ? normalizeProse(params.description) ||
      cardDescription ||
      normalizeProse(tool?.description)
    : cardDescription || normalizeProse(params.description);

  let intent = "";
  if (tTools.has(`intents.${slug}`)) {
    intent = normalizeProse(tTools(`intents.${slug}`));
  } else if (!isEnglish && cardDescription) {
    intent = cardDescription;
  } else if (isEnglish) {
    intent =
      normalizeProse(params.intent) ||
      normalizeProse(tool?.intent) ||
      description;
  } else {
    intent = normalizeProse(params.intent) || description;
  }

  const whyItMatters = isEnglish
    ? normalizeProse(params.whyItMatters) ||
      normalizeProse(tool?.documentation?.whyItMatters) ||
      null
    : normalizeProse(params.whyItMatters) || null;

  const useCases = isEnglish
    ? (params.useCases?.length ? params.useCases : tool?.useCases) ?? []
    : params.useCases?.length
      ? params.useCases
      : [];

  const primaryKeyword = isEnglish ? tool?.primaryKeyword ?? null : null;

  return {
    title,
    description,
    intent,
    whyItMatters,
    useCases: useCases.filter(Boolean),
    primaryKeyword,
  };
}

/**
 * Build enriched DOC-tab body copy. Synthesis templates must already be
 * localized; registry English fallbacks are gated by `locale`.
 */
export function buildEnrichedToolDocContent(params: {
  slug: string;
  title: string;
  locale?: string;
  description?: string | null;
  intent?: string | null;
  whyItMatters?: string | null;
  useCases?: string[] | null;
  realWorldExampleBody?: string | null;
  templates: ToolDocSynthesisTemplates;
}): ToolDocBodyContent {
  const locale = params.locale ?? "en";
  const isEnglish = locale === "en";
  const tool = registry.tools.find((entry) => entry.slug === params.slug);
  const toolName =
    normalizeToolNameForDocH1(params.title) ||
    params.title.trim() ||
    (isEnglish ? tool?.title : undefined) ||
    params.slug;

  const description =
    normalizeProse(params.description) ||
    (isEnglish ? normalizeProse(tool?.description) : "");
  const intent =
    normalizeProse(params.intent) || (isEnglish ? normalizeProse(tool?.intent) : "");
  const whyItMatters =
    normalizeProse(params.whyItMatters) ||
    (isEnglish ? normalizeProse(tool?.documentation?.whyItMatters) : "");
  let useCases =
    (params.useCases?.length
      ? params.useCases
      : isEnglish
        ? tool?.useCases
        : undefined) ?? [];

  const overviewParagraphs = synthesizeOverview(
    toolName,
    description || undefined,
    intent || undefined,
    params.templates,
  );
  const howSource =
    intent && description && proseKey(intent) !== proseKey(description)
      ? intent
      : whyItMatters && proseKey(whyItMatters) !== proseKey(description)
        ? undefined
        : intent || undefined;
  const howItWorksParagraphs = synthesizeHowItWorks(
    toolName,
    howSource,
    params.templates,
  );

  const whyDistinct =
    whyItMatters &&
    !overviewParagraphs.some((p) => proseKey(p) === proseKey(whyItMatters)) &&
    !howItWorksParagraphs.some((p) => proseKey(p) === proseKey(whyItMatters))
      ? whyItMatters
      : null;

  const localizedExample = normalizeProse(params.realWorldExampleBody);
  const englishExample = isEnglish
    ? normalizeProse(getToolRealWorldExample(params.slug))
    : "";

  let realWorldExample: ToolDocBodyContent["realWorldExample"] = null;
  if (localizedExample || englishExample) {
    realWorldExample = {
      heading: params.templates.realWorldHeading,
      body: localizedExample || englishExample,
    };
  } else if (whyDistinct) {
    realWorldExample = {
      heading: params.templates.whyYouNeedThisHeading,
      body: whyDistinct,
    };
  } else {
    realWorldExample = {
      heading: params.templates.realWorldHeading,
      body: fillToolName(params.templates.realWorldFallback, toolName),
    };
  }

  if (!useCases.length && !isEnglish) {
    useCases = synthesizeUseCases(toolName, params.templates);
  }

  return {
    overviewParagraphs,
    howItWorksParagraphs,
    realWorldExample,
    useCases: useCases.filter(Boolean),
    whyItMatters: realWorldExample?.body === whyDistinct ? null : whyDistinct,
  };
}
