"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolDocBodySections } from "@/components/layout/ToolDocBodySections";
import { ToolDocHeader } from "@/components/layout/ToolDocHeader";
import { ToolModalFaqAccordion, faqItemsKey } from "@/components/tool-modal/ToolModalFaqAccordion";
import { registry } from "@/lib/registry";
import { buildLocalizedToolFaqs } from "@/lib/tool-faqs";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";
import type {
  ToolModalDocModel,
  ToolModalRelatedArticle,
  ToolModalRelatedTool,
} from "@/lib/tool-modal-catalog";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { WORKSPACE_PHASE_MESSAGE } from "@/lib/workspace-flow";
import {
  TOOL_EMBED_HEIGHT_MESSAGE,
  TOOL_EMBED_HEIGHT_REQUEST_MESSAGE,
} from "@/lib/workspace-project-messages";

/** Viewport-based iframe height for clean-phase immersive dropzone (avoids scrollHeight feedback). */
function measureToolEmbedFillHeight(): number {
  const rootStyles = getComputedStyle(document.documentElement);
  const siteHeader =
    Number.parseFloat(rootStyles.getPropertyValue("--site-header-height")) || 120;
  const modal = document.querySelector(".tool-modal--fullscreen, .tool-modal");
  const title =
    modal?.querySelector(".tool-upload-stage")?.getBoundingClientRect().height
      ? 0
      : (modal?.querySelector(".tool-modal__chrome")?.getBoundingClientRect().height ??
        modal?.querySelector(".tool-modal__heading")?.getBoundingClientRect().height ??
        8);
  const footer =
    modal?.querySelector(".tool-modal__site-footer")?.getBoundingClientRect().height ?? 56;
  // title + tight body gap + footer block margin
  const chrome = siteHeader + title + footer + 4 + 30;
  return Math.max(400, Math.round(window.innerHeight - chrome));
}

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
  const tPageRef = useRef(tPage);
  tPageRef.current = tPage;

  // Keep FAQ list stable across parent re-renders. `tPage` / `model.faqs`
  // identities change often and previously fed update-depth loops.
  const faqItems = useMemo(() => {
    const translate = tPageRef.current;
    try {
      const tool = registry.tools.find((entry) => entry.slug === model.slug);
      const faqs =
        tool && translate
          ? buildLocalizedToolFaqs(translate, tool, null, model.title, locale, {
              intent: model.intent,
              primaryKeyword: model.primaryKeyword ?? model.title,
            })
          : model.faqs;
      return (faqs ?? []).map((item) => ({
        question: item.q,
        answer: item.a,
      }));
    } catch {
      return (model.faqs ?? []).map((item) => ({
        question: item.q,
        answer: item.a,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally ignore tPage / model.faqs identity
  }, [model.slug, model.title, model.intent, model.primaryKeyword, locale]);

  const faqKey = faqItemsKey(faqItems);

  const introDescription =
    normalizeProse(model.description) ||
    normalizeProse(model.intent) ||
    normalizeProse(model.whyItMatters);

  return (
    <article className="tool-modal-docs" aria-labelledby="tool-docs-title">
      <ToolDocHeader
        slug={model.slug}
        title={model.title}
        description={introDescription}
        categoryId={categoryId}
      />

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
            key={faqKey || model.slug}
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [embedMode, setEmbedMode] = useState<"content" | "fill">("fill");
  const [embedHeight, setEmbedHeight] = useState<number | null>(null);

  useEffect(() => {
    setReady(false);
    setEmbedMode("fill");
    setEmbedHeight(null);
    onReadyChange?.(false);
    // Failsafe: never leave the parent stuck on "Loading tool…" if onLoad is lost.
    const failsafe = window.setTimeout(() => {
      setReady(true);
      onReadyChange?.(true);
    }, 12_000);
    return () => window.clearTimeout(failsafe);
    // Only reset when the embed URL changes — not when the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit onReadyChange
  }, [src]);

  const requestEmbedHeight = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: TOOL_EMBED_HEIGHT_REQUEST_MESSAGE },
        window.location.origin,
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const HEIGHT_EPS = 4;

    const applyFill = () => {
      const next = measureToolEmbedFillHeight();
      setEmbedMode((mode) => (mode === "fill" ? mode : "fill"));
      setEmbedHeight((prev) => {
        if (prev != null && Math.abs(prev - next) < HEIGHT_EPS) return prev;
        return next;
      });
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;

      if (type === WORKSPACE_PHASE_MESSAGE) {
        return;
      }

      if (type !== TOOL_EMBED_HEIGHT_MESSAGE) return;

      const mode = (data as { mode?: string }).mode;
      if (mode === "fill") {
        applyFill();
        return;
      }

      const height = Number((data as { height?: number }).height);
      if (!Number.isFinite(height) || height < 1) return;
      const next = Math.ceil(height);
      setEmbedMode((prev) => (prev === "content" ? prev : "content"));
      setEmbedHeight((prev) => {
        if (prev != null && Math.abs(prev - next) < HEIGHT_EPS) return prev;
        return next;
      });
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (embedMode !== "fill") return;
    const onResize = () => {
      const next = measureToolEmbedFillHeight();
      setEmbedHeight((prev) => {
        if (prev != null && Math.abs(prev - next) < 4) return prev;
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [embedMode]);

  return (
    <div
      className="tool-modal__calc-shell"
      style={
        embedHeight
          ? ({ "--tool-embed-height": `${embedHeight}px` } as CSSProperties)
          : undefined
      }
    >
      {!ready ? (
        <div className="tool-modal__calc-loading" aria-live="polite" aria-busy="true">
          <span className="tool-modal__calc-spinner" aria-hidden />
          <span className="tool-modal__calc-loading-text">{loadingLabel}</span>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        className={
          ready ? "tool-modal__iframe tool-modal__iframe--ready" : "tool-modal__iframe"
        }
        src={src}
        title={title}
        loading="eager"
        referrerPolicy="no-referrer"
        style={
          embedHeight
            ? { height: embedHeight, minHeight: embedHeight }
            : undefined
        }
        onLoad={() => {
          setReady(true);
          onReadyChange?.(true);
          // Re-request height: early iframe posts can fire before this listener
          // is attached, leaving the iframe at the CSS fallback height.
          requestEmbedHeight();
          window.setTimeout(requestEmbedHeight, 250);
        }}
      />
    </div>
  );
}
