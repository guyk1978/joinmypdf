"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolModalFaqAccordion } from "@/components/tool-modal/ToolModalFaqAccordion";
import { registry } from "@/lib/registry";
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
};

type RelatedLabels = {
  toolsHeading?: string;
  articlesHeading?: string;
  empty?: string;
};

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
        ? buildLocalizedToolFaqs(tPage, tool, null, model.title, locale)
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
  }, [model.slug, model.title, model.faqs, locale, tPage]);

  const loadingLabel = labels?.loading ?? "Loading…";

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

  return (
    <article className="tool-modal-docs">
      <section className="tool-modal-docs__section">
        <h3 className="tool-modal-docs__heading">{labels?.overview ?? "Overview"}</h3>
        {model.description ? (
          <p className="tool-modal-docs__text">{model.description}</p>
        ) : (
          <p className="tool-modal-docs__text tool-modal-docs__text--muted">
            Documentation for this tool is coming soon.
          </p>
        )}
      </section>

      {model.intent || model.primaryKeyword ? (
        <section className="tool-modal-docs__section">
          <h3 className="tool-modal-docs__heading">
            {labels?.howItWorks ?? "How it works"}
          </h3>
          {model.intent ? <p className="tool-modal-docs__text">{model.intent}</p> : null}
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

      {model.useCases.length > 0 ? (
        <section className="tool-modal-docs__section">
          <h3 className="tool-modal-docs__heading">{labels?.useCases ?? "Use cases"}</h3>
          <ul className="tool-modal-docs__list">
            {model.useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {faqItems.length > 0 ? (
        <section className="tool-modal-docs__section tool-modal-docs__section--faq">
          <h3 className="tool-modal-docs__heading">
            {labels?.faq ?? "FAQ"}
            <span className="tool-modal-docs__faq-count">{faqItems.length}</span>
          </h3>
          <ToolModalFaqAccordion
            key={model.slug}
            items={faqItems}
            expandAllLabel={labels?.expandAll ?? "Expand all"}
            collapseAllLabel={labels?.collapseAll ?? "Collapse all"}
          />
        </section>
      ) : null}
    </article>
  );
}

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
