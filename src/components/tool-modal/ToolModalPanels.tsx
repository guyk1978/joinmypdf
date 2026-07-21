"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolDocBodySections } from "@/components/layout/ToolDocBodySections";
import { ToolDocHeader } from "@/components/layout/ToolDocHeader";
import { ToolModalFaqAccordion } from "@/components/tool-modal/ToolModalFaqAccordion";
import { registry } from "@/lib/registry";
import { faqLd, serializeJsonLd } from "@/lib/schema";
import { buildLocalizedToolFaqs } from "@/lib/tool-faqs";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";
import type {
  ToolModalDocModel,
  ToolModalRelatedArticle,
  ToolModalRelatedTool,
} from "@/lib/tool-modal-catalog";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

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
  realWorldExample?: string;
};

type RelatedLabels = {
  toolsHeading?: string;
  articlesHeading?: string;
  empty?: string;
};

const DEFAULT_OPEN_FAQ_COUNT = 4;

function normalizeProse(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * DOC-tab documentation for a tool — enriched overview, how-it-works,
 * real-world examples, use cases, and FAQs.
 */
export function ToolModalDocsPanel({
  model,
  labels,
  tPage,
  categoryId,
}: {
  model: ToolModalDocModel;
  labels?: DocsLabels;
  tPage?: ToolPageTranslator;
  categoryId?: InventoryCategoryId;
}) {
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setFaqItems([]);

    const frame = requestAnimationFrame(() => {
      const tool = registry.tools.find((entry) => entry.slug === model.slug);
      const faqs =
        tool && tPage
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

  const loadingLabel = labels?.loading ?? "Loading…";
  const faqSchemaItems = useMemo(
    () => faqItems.map((item) => ({ q: item.question, a: item.answer })),
    [faqItems],
  );

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

  const introDescription =
    normalizeProse(model.description) ||
    normalizeProse(model.intent) ||
    normalizeProse(model.whyItMatters);

  const docsTitle = (
    <ToolDocHeader
      slug={model.slug}
      title={model.title}
      description={introDescription}
      categoryId={categoryId}
    />
  );

  if (isLoading) {
    return (
      <div className="tool-modal-docs tool-modal-docs--loading" aria-busy="true" aria-live="polite">
        {docsTitle}
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

  return (
    <article className="tool-modal-docs" aria-labelledby="tool-docs-title">
      {docsTitle}

      <ToolDocBodySections
        slug={model.slug}
        title={model.title}
        description={model.description}
        intent={model.intent}
        whyItMatters={model.whyItMatters}
        useCases={model.useCases}
        primaryKeyword={model.primaryKeyword}
        labels={{
          overview: labels?.overview,
          howItWorks: labels?.howItWorks,
          useCases: labels?.useCases,
          realWorldExample: labels?.realWorldExample,
          keyword: labels?.keyword,
          comingSoon: labels?.comingSoon,
        }}
      />

      {faqItems.length > 0 ? (
        <section
          className="tool-modal-docs__section tool-modal-docs__section--faq"
          aria-labelledby="tool-docs-faq"
        >
          <h2 id="tool-docs-faq" className="tool-modal-docs__heading">
            {labels?.faq ?? "FAQ"}
            <span className="tool-modal-docs__faq-count">{faqItems.length}</span>
          </h2>
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
