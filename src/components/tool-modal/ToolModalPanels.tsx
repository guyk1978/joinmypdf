"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolModalFaqAccordion } from "@/components/tool-modal/ToolModalFaqAccordion";
import { registry } from "@/lib/registry";
import { faqLd, serializeJsonLd } from "@/lib/schema";
import { buildLocalizedToolFaqs } from "@/lib/tool-faqs";
import type {
  ToolModalDocModel,
  ToolModalRelatedArticle,
  ToolModalRelatedTool,
} from "@/lib/tool-modal-catalog";

type DocsLabels = {
  overview?: string;
  howItWorks?: string;
  useCases?: string;
  faq?: string;
  keyword?: string;
  loading?: string;
  expandAll?: string;
  collapseAll?: string;
  comingSoon?: string;
  localProcessing?: string;
};

type RelatedLabels = {
  toolsHeading?: string;
  articlesHeading?: string;
  empty?: string;
};

const MIN_PROSE_CHARS = 120;
const DEFAULT_OPEN_FAQ_COUNT = 4;

function normalizeProse(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function proseKey(value: string): string {
  return value.toLowerCase();
}

function buildLocalProcessingFallback(toolTitle: string, custom?: string): string {
  if (custom?.trim()) return custom.trim();
  return `${toolTitle} runs entirely in your browser with 100% local processing — your files never leave your device, so privacy and speed stay under your control.`;
}

/**
 * DOC-tab documentation for a tool — SEO-oriented prose, use cases, and FAQs.
 * Prefer this over duplicating overview/how-it-works when registry copy overlaps.
 */
export function ToolModalDocsPanel({
  model,
  labels,
}: {
  model: ToolModalDocModel;
  labels?: DocsLabels;
}) {
  const locale = useLocale();
  const tPage = useTranslations("ToolPage");
  const [isLoading, setIsLoading] = useState(true);
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);

  // Build the full FAQ list (tool-specific + universal) after mount — avoids truncated DOC jump.
  useEffect(() => {
    setIsLoading(true);
    setFaqItems([]);

    const frame = requestAnimationFrame(() => {
      const tool = registry.tools.find((entry) => entry.slug === model.slug);
      const faqs = tool
        ? buildLocalizedToolFaqs(tPage, tool, null, model.title, locale, {
            intent: model.intent,
            primaryKeyword: model.primaryKeyword ?? model.title,
          })
        : model.faqs;

      setFaqItems(
        faqs.map((item) => ({
          question: item.q,
          answer: item.a,
        })),
      );
      setIsLoading(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [model.slug, model.title, model.faqs, model.intent, model.primaryKeyword, locale, tPage]);

  const prose = useMemo(() => {
    const overview = normalizeProse(model.description);
    const howItWorks = normalizeProse(model.intent);
    const whyItMatters = normalizeProse(model.whyItMatters);

    const overviewKey = overview ? proseKey(overview) : "";
    const howKey = howItWorks ? proseKey(howItWorks) : "";
    const whyKey = whyItMatters ? proseKey(whyItMatters) : "";

    const howMatchesOverview = Boolean(overviewKey && howKey && overviewKey === howKey);
    const whyMatchesOverview = Boolean(whyKey && overviewKey && whyKey === overviewKey);
    const whyMatchesHow = Boolean(whyKey && howKey && whyKey === howKey);

    // Only split How it Works when Overview already has distinct prose.
    const hasSeparateHowItWorks =
      Boolean(overview) && Boolean(howItWorks) && !howMatchesOverview;
    const hasSeparateWhy =
      Boolean(whyItMatters) && !whyMatchesOverview && !whyMatchesHow;

    const primaryParagraphs: string[] = [];
    if (overview) primaryParagraphs.push(overview);
    else if (howItWorks) primaryParagraphs.push(howItWorks);
    else if (whyItMatters) primaryParagraphs.push(whyItMatters);

    // If why was used as the only primary paragraph, don't repeat it below.
    const whyUsedAsPrimary =
      !overview && !howItWorks && Boolean(whyItMatters);
    const showWhySection = hasSeparateWhy && !whyUsedAsPrimary;

    const uniqueBody = [
      overview,
      hasSeparateHowItWorks ? howItWorks : "",
      showWhySection ? whyItMatters : "",
    ]
      .filter(Boolean)
      .join(" ");

    const needsLocalFallback = uniqueBody.length < MIN_PROSE_CHARS;
    const localFallback = needsLocalFallback
      ? buildLocalProcessingFallback(model.title, labels?.localProcessing)
      : null;

    return {
      overview,
      howItWorks,
      whyItMatters,
      howMatchesOverview,
      hasSeparateHowItWorks,
      hasSeparateWhy: showWhySection,
      primaryParagraphs,
      localFallback,
      combineOverviewAndHow: !hasSeparateHowItWorks,
    };
  }, [
    model.description,
    model.intent,
    model.whyItMatters,
    model.title,
    labels?.localProcessing,
  ]);

  const loadingLabel = labels?.loading ?? "Loading…";
  const faqSchemaItems = useMemo(
    () => faqItems.map((item) => ({ q: item.question, a: item.answer })),
    [faqItems],
  );

  // Inject FAQPage JSON-LD into <head> so crawlers can parse the full FAQ set.
  useEffect(() => {
    if (!faqSchemaItems.length) return;

    const scriptId = `tool-faq-ld-${model.slug}`;
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.text = serializeJsonLd(faqLd(faqSchemaItems));
    document.head.appendChild(script);

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [faqSchemaItems, model.slug]);

  if (isLoading) {
    return (
      <div className="tool-modal-docs tool-modal-docs--loading" aria-busy="true" aria-live="polite">
        <div className="tool-modal-docs__skeleton">
          <span className="tool-modal__calc-spinner" aria-hidden />
          <span className="tool-modal-docs__loading-text">{loadingLabel}</span>
        </div>
        <div className="tool-modal-docs__skeleton-lines" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const overviewHeading = prose.combineOverviewAndHow
    ? (labels?.overview ?? "Overview")
    : (labels?.overview ?? "Overview");

  return (
    <article className="tool-modal-docs">
      <section className="tool-modal-docs__section" aria-labelledby="tool-docs-overview">
        <h3 id="tool-docs-overview" className="tool-modal-docs__heading">
          {overviewHeading}
        </h3>
        {prose.primaryParagraphs.length > 0 ? (
          prose.primaryParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="tool-modal-docs__text">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="tool-modal-docs__text tool-modal-docs__text--muted">
            {labels?.comingSoon ?? "Documentation for this tool is coming soon."}
          </p>
        )}
        {prose.localFallback ? (
          <p className="tool-modal-docs__text tool-modal-docs__text--fallback">
            {prose.localFallback}
          </p>
        ) : null}
        {model.primaryKeyword && prose.combineOverviewAndHow ? (
          <p className="tool-modal-docs__meta">
            <span className="tool-modal-docs__meta-label">
              {labels?.keyword ?? "Focus"}
            </span>
            <span className="tool-modal-docs__meta-value">{model.primaryKeyword}</span>
          </p>
        ) : null}
      </section>

      {prose.hasSeparateHowItWorks ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-how">
          <h3 id="tool-docs-how" className="tool-modal-docs__heading">
            {labels?.howItWorks ?? "How it works"}
          </h3>
          <p className="tool-modal-docs__text">{prose.howItWorks}</p>
          {model.primaryKeyword ? (
            <p className="tool-modal-docs__meta">
              <span className="tool-modal-docs__meta-label">
                {labels?.keyword ?? "Focus"}
              </span>
              <span className="tool-modal-docs__meta-value">{model.primaryKeyword}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {prose.hasSeparateWhy ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-why">
          <h3 id="tool-docs-why" className="tool-modal-docs__heading">
            Why it matters
          </h3>
          <p className="tool-modal-docs__text">{prose.whyItMatters}</p>
        </section>
      ) : null}

      {model.useCases.length > 0 ? (
        <section className="tool-modal-docs__section" aria-labelledby="tool-docs-use-cases">
          <h3 id="tool-docs-use-cases" className="tool-modal-docs__heading">
            {labels?.useCases ?? "Use cases"}
          </h3>
          <ul className="tool-modal-docs__list">
            {model.useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {faqItems.length > 0 ? (
        <section
          className="tool-modal-docs__section tool-modal-docs__section--faq"
          aria-labelledby="tool-docs-faq"
        >
          <h3 id="tool-docs-faq" className="tool-modal-docs__heading">
            {labels?.faq ?? "FAQ"}
            <span className="tool-modal-docs__faq-count">{faqItems.length}</span>
          </h3>
          <ToolModalFaqAccordion
            key={model.slug}
            items={faqItems}
            defaultOpenCount={DEFAULT_OPEN_FAQ_COUNT}
            expandAllLabel={labels?.expandAll ?? "Expand all"}
            collapseAllLabel={labels?.collapseAll ?? "Collapse all"}
          />
        </section>
      ) : null}
    </article>
  );
}

/** @deprecated Prefer `ToolModalDocsPanel` — kept as an explicit SEO-facing alias. */
export const ToolDocumentation = ToolModalDocsPanel;

export function ToolModalRelatedPanel({
  tools,
  articles,
  labels,
  onOpenTool,
}: {
  tools: ToolModalRelatedTool[];
  articles: ToolModalRelatedArticle[];
  labels?: RelatedLabels;
  onOpenTool?: (tool: ToolModalRelatedTool) => void;
}) {
  const empty = tools.length === 0 && articles.length === 0;

  if (empty) {
    return (
      <p className="tool-modal-related__empty">
        {labels?.empty ?? "No related tools or articles yet."}
      </p>
    );
  }

  return (
    <div className="tool-modal-related">
      {tools.length > 0 ? (
        <section className="tool-modal-related__section">
          <h3 className="tool-modal-related__heading">
            {labels?.toolsHeading ?? "Also check out"}
          </h3>
          <ul className="tool-modal-related__list">
            {tools.map((tool) => (
              <li key={tool.slug}>
                {onOpenTool ? (
                  <button
                    type="button"
                    className="tool-modal-related__card"
                    onClick={() => onOpenTool(tool)}
                  >
                    <span className="tool-modal-related__card-title">{tool.title}</span>
                    {tool.description ? (
                      <span className="tool-modal-related__card-desc">{tool.description}</span>
                    ) : null}
                  </button>
                ) : (
                  <Link href={tool.href} className="tool-modal-related__card" prefetch={false}>
                    <span className="tool-modal-related__card-title">{tool.title}</span>
                    {tool.description ? (
                      <span className="tool-modal-related__card-desc">{tool.description}</span>
                    ) : null}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section className="tool-modal-related__section">
          <h3 className="tool-modal-related__heading">
            {labels?.articlesHeading ?? "Guides & articles"}
          </h3>
          <ul className="tool-modal-related__list">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link href={article.href} className="tool-modal-related__card" prefetch={false}>
                  <span className="tool-modal-related__card-title">{article.title}</span>
                  {article.description ? (
                    <span className="tool-modal-related__card-desc">{article.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Isolated CALC iframe with loading mask until the embed is ready. */
export function ToolModalCalcFrame({
  src,
  title,
  loadingLabel = "Loading tool…",
  onReadyChange,
}: {
  src: string;
  title: string;
  loadingLabel?: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    onReadyChange?.(false);
  }, [src, onReadyChange]);

  return (
    <div className="tool-modal__calc-shell">
      {!ready ? (
        <div className="tool-modal__calc-loading" aria-live="polite" aria-busy="true">
          <span className="tool-modal__calc-spinner" aria-hidden />
          <span className="tool-modal__calc-loading-text">{loadingLabel}</span>
        </div>
      ) : null}
      <iframe
        className={
          ready ? "tool-modal__iframe tool-modal__iframe--ready" : "tool-modal__iframe"
        }
        src={src}
        title={title}
        loading="eager"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setReady(true);
          onReadyChange?.(true);
        }}
      />
    </div>
  );
}
