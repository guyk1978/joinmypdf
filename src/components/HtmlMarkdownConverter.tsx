"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  HtmlMarkdownLocalFirstBar,
  type HtmlMarkdownLocalFirstBarLabels,
} from "@/components/HtmlMarkdownLocalFirstBar";
import {
  HtmlMarkdownProjectPanel,
  type HtmlMarkdownProjectLabels,
} from "@/components/HtmlMarkdownProjectPanel";
import {
  HtmlMarkdownSeoAuditPanel,
  type HtmlMarkdownSeoAuditLabels,
} from "@/components/HtmlMarkdownSeoAuditPanel";
import {
  buildHtmlPreviewDocument,
  clearHtmlMarkdownState,
  convertHtmlToMarkdown,
  convertMarkdownToHtml,
  copyTextToClipboard,
  DEFAULT_MARKDOWN_SAMPLE,
  downloadHtmlExport,
  downloadMarkdownExport,
  loadHtmlMarkdownState,
  saveHtmlMarkdownState,
  syncProportionalScroll,
  type HtmlMarkdownConverterMode,
  type MarkdownFlavor,
} from "@/lib/html-markdown-converter";
import { auditHtmlForSeo } from "@/lib/html-markdown-seo-audit";

export type HtmlMarkdownConverterLabels = HtmlMarkdownLocalFirstBarLabels &
  HtmlMarkdownSeoAuditLabels &
  HtmlMarkdownProjectLabels & {
  modeMarkdownToHtml: string;
  modeHtmlToMarkdown: string;
  markdownInputLabel: string;
  htmlOutputLabel: string;
  htmlInputLabel: string;
  markdownOutputLabel: string;
  markdownPlaceholder: string;
  htmlPlaceholder: string;
  copyHtmlButton: string;
  copyMarkdownButton: string;
  downloadHtmlButton: string;
  downloadMarkdownButton: string;
  flavorLabel: string;
  flavorGfm: string;
  flavorCommonmark: string;
  syncScrollLabel: string;
  previewButton: string;
  codeButton: string;
  copied: string;
  copyFailed: string;
  };

type HtmlMarkdownConverterProps = {
  labels: HtmlMarkdownConverterLabels;
  className?: string;
};

export function HtmlMarkdownConverter({ labels, className }: HtmlMarkdownConverterProps) {
  const markdownId = useId();
  const htmlId = useId();

  const leftScrollRef = useRef<HTMLTextAreaElement | HTMLPreElement | null>(null);
  const rightScrollRef = useRef<HTMLTextAreaElement | HTMLPreElement | null>(null);
  const syncingScrollRef = useRef(false);

  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<HtmlMarkdownConverterMode>("markdown-to-html");
  const [flavor, setFlavor] = useState<MarkdownFlavor>("gfm");
  const [syncScroll, setSyncScroll] = useState(true);
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN_SAMPLE);
  const [html, setHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const syncScrollActive = syncScroll && !(previewOpen && mode === "markdown-to-html");

  const seoFindings = useMemo(() => auditHtmlForSeo(html), [html]);

  const seoLabels = useMemo<HtmlMarkdownSeoAuditLabels>(
    () => ({
      seoAuditTitle: labels.seoAuditTitle,
      seoAuditHint: labels.seoAuditHint,
      seoNoHtml: labels.seoNoHtml,
      seoH1Missing: labels.seoH1Missing,
      seoH1Multiple: labels.seoH1Multiple,
      seoHeadingSkip: labels.seoHeadingSkip,
      seoTooManyHeadings: labels.seoTooManyHeadings,
      seoImgMissingAlt: labels.seoImgMissingAlt,
      seoLongParagraph: labels.seoLongParagraph,
      seoStructureGood: labels.seoStructureGood,
    }),
    [labels],
  );

  useEffect(() => {
    const saved = loadHtmlMarkdownState();
    if (saved) {
      setMode(saved.mode);
      setFlavor(saved.flavor);
      setMarkdown(saved.markdown);
      setHtml(saved.html);
      setSyncScroll(saved.syncScroll !== false);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      saveHtmlMarkdownState({ mode, flavor, markdown, html, syncScroll });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [hydrated, mode, flavor, markdown, html, syncScroll]);

  const onClearAll = () => {
    clearHtmlMarkdownState();
    setMode("markdown-to-html");
    setFlavor("gfm");
    setSyncScroll(true);
    setMarkdown("");
    setHtml("");
    setPreviewOpen(false);
    setError(null);
    setCopiedHtml(false);
    setCopiedMarkdown(false);
  };

  const handlePaneScroll = useCallback(
    (sourceSide: "left" | "right") => {
      if (!syncScrollActive || syncingScrollRef.current) return;

      const source = sourceSide === "left" ? leftScrollRef.current : rightScrollRef.current;
      const target = sourceSide === "left" ? rightScrollRef.current : leftScrollRef.current;
      if (!source || !target) return;

      syncingScrollRef.current = true;
      syncProportionalScroll(source, target);
      window.requestAnimationFrame(() => {
        syncingScrollRef.current = false;
      });
    },
    [syncScrollActive],
  );

  useEffect(() => {
    if (mode !== "markdown-to-html") return;

    let cancelled = false;

    void convertMarkdownToHtml(markdown, { flavor }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setHtml(result.output);
        setError(null);
        return;
      }
      setError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [mode, markdown, flavor]);

  useEffect(() => {
    if (mode !== "html-to-markdown") return;

    let cancelled = false;

    void convertHtmlToMarkdown(html).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setMarkdown(result.output);
        setError(null);
        return;
      }
      setError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [mode, html]);

  const onCopyHtml = async () => {
    if (!html) return;
    const success = await copyTextToClipboard(html);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }
    setCopiedHtml(true);
    window.setTimeout(() => setCopiedHtml(false), 1600);
  };

  const onCopyMarkdown = async () => {
    if (!markdown) return;
    const success = await copyTextToClipboard(markdown);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }
    setCopiedMarkdown(true);
    window.setTimeout(() => setCopiedMarkdown(false), 1600);
  };

  const leftIsMarkdown = mode === "markdown-to-html";
  const rightIsHtml = mode === "markdown-to-html";

  const renderHtmlPanel = (editable: boolean, scrollSide: "left" | "right") => {
    const scrollRef = scrollSide === "left" ? leftScrollRef : rightScrollRef;
    const showPreview = !editable && previewOpen && html.trim();

    return (
      <div className="html-md-converter-tool__pane">
        <div className="html-md-converter-tool__pane-header">
          <label className="html-md-converter-tool__label" htmlFor={editable ? htmlId : undefined}>
            {editable ? labels.htmlInputLabel : labels.htmlOutputLabel}
          </label>
          <div className="html-md-converter-tool__pane-actions">
            {!editable ? (
              <button
                type="button"
                className={clsx(
                  "html-md-converter-tool__preview-btn",
                  previewOpen && "html-md-converter-tool__preview-btn--active",
                )}
                onClick={() => setPreviewOpen((open) => !open)}
                disabled={!html.trim()}
                aria-pressed={previewOpen}
              >
                {previewOpen ? labels.codeButton : labels.previewButton}
              </button>
            ) : null}
            <button
              type="button"
              className="html-md-converter-tool__copy-btn"
              onClick={() => downloadHtmlExport(html)}
              disabled={!html}
            >
              {labels.downloadHtmlButton}
            </button>
            <button
              type="button"
              className={clsx(
                "html-md-converter-tool__copy-btn",
                copiedHtml && "html-md-converter-tool__copy-btn--copied",
              )}
              onClick={() => void onCopyHtml()}
              disabled={!html}
            >
              {copiedHtml ? labels.copied : labels.copyHtmlButton}
            </button>
          </div>
        </div>

        {showPreview ? (
          <iframe
            className="html-md-converter-tool__preview"
            title={labels.previewButton}
            sandbox=""
            srcDoc={buildHtmlPreviewDocument(html)}
          />
        ) : editable ? (
          <textarea
            id={htmlId}
            ref={(node) => {
              scrollRef.current = node;
            }}
            className="html-md-converter-tool__textarea html-md-converter-tool__scroll-pane"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            onScroll={() => handlePaneScroll(scrollSide)}
            placeholder={labels.htmlPlaceholder}
            spellCheck={false}
            rows={18}
          />
        ) : (
          <pre
            ref={(node) => {
              scrollRef.current = node;
            }}
            className="html-md-converter-tool__code html-md-converter-tool__scroll-pane"
            aria-live="polite"
            onScroll={() => handlePaneScroll(scrollSide)}
          >
            {html || "\u00a0"}
          </pre>
        )}
      </div>
    );
  };

  const renderMarkdownPanel = (editable: boolean, scrollSide: "left" | "right") => {
    const scrollRef = scrollSide === "left" ? leftScrollRef : rightScrollRef;

    return (
      <div className="html-md-converter-tool__pane">
        <div className="html-md-converter-tool__pane-header">
          <label className="html-md-converter-tool__label" htmlFor={editable ? markdownId : undefined}>
            {editable ? labels.markdownInputLabel : labels.markdownOutputLabel}
          </label>
          <div className="html-md-converter-tool__pane-actions">
            <button
              type="button"
              className="html-md-converter-tool__copy-btn"
              onClick={() => downloadMarkdownExport(markdown)}
              disabled={!markdown}
            >
              {labels.downloadMarkdownButton}
            </button>
            <button
              type="button"
              className={clsx(
                "html-md-converter-tool__copy-btn",
                copiedMarkdown && "html-md-converter-tool__copy-btn--copied",
              )}
              onClick={() => void onCopyMarkdown()}
              disabled={!markdown}
            >
              {copiedMarkdown ? labels.copied : labels.copyMarkdownButton}
            </button>
          </div>
        </div>

        {editable ? (
          <textarea
            id={markdownId}
            ref={(node) => {
              scrollRef.current = node;
            }}
            className="html-md-converter-tool__textarea html-md-converter-tool__scroll-pane"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            onScroll={() => handlePaneScroll(scrollSide)}
            placeholder={labels.markdownPlaceholder}
            spellCheck={false}
            rows={18}
          />
        ) : (
          <pre
            ref={(node) => {
              scrollRef.current = node;
            }}
            className="html-md-converter-tool__code html-md-converter-tool__scroll-pane"
            aria-live="polite"
            onScroll={() => handlePaneScroll(scrollSide)}
          >
            {markdown || "\u00a0"}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className={clsx("html-md-converter-tool", className)}>
      <HtmlMarkdownLocalFirstBar labels={labels} onClearAll={onClearAll} />

      <div className="html-md-converter-tool__mode tool-workspace-panel">
        <div className="html-md-converter-tool__mode-toggle" role="group" aria-label={labels.modeMarkdownToHtml}>
          <button
            type="button"
            className={clsx(
              "html-md-converter-tool__mode-btn",
              mode === "markdown-to-html" && "html-md-converter-tool__mode-btn--active",
            )}
            aria-pressed={mode === "markdown-to-html"}
            onClick={() => {
              setMode("markdown-to-html");
              setPreviewOpen(false);
            }}
          >
            {labels.modeMarkdownToHtml}
          </button>
          <button
            type="button"
            className={clsx(
              "html-md-converter-tool__mode-btn",
              mode === "html-to-markdown" && "html-md-converter-tool__mode-btn--active",
            )}
            aria-pressed={mode === "html-to-markdown"}
            onClick={() => {
              setMode("html-to-markdown");
              setPreviewOpen(false);
            }}
          >
            {labels.modeHtmlToMarkdown}
          </button>
        </div>

        {mode === "markdown-to-html" ? (
          <div className="html-md-converter-tool__flavor" role="group" aria-label={labels.flavorLabel}>
            <span className="html-md-converter-tool__flavor-label">{labels.flavorLabel}</span>
            <button
              type="button"
              className={clsx(
                "html-md-converter-tool__mode-btn",
                flavor === "gfm" && "html-md-converter-tool__mode-btn--active",
              )}
              aria-pressed={flavor === "gfm"}
              onClick={() => setFlavor("gfm")}
            >
              {labels.flavorGfm}
            </button>
            <button
              type="button"
              className={clsx(
                "html-md-converter-tool__mode-btn",
                flavor === "commonmark" && "html-md-converter-tool__mode-btn--active",
              )}
              aria-pressed={flavor === "commonmark"}
              onClick={() => setFlavor("commonmark")}
            >
              {labels.flavorCommonmark}
            </button>
          </div>
        ) : null}

        <label className="html-md-converter-tool__sync-toggle">
          <input
            type="checkbox"
            className="html-md-converter-tool__sync-input"
            checked={syncScroll}
            onChange={(event) => setSyncScroll(event.target.checked)}
          />
          <span>{labels.syncScrollLabel}</span>
        </label>
      </div>

      {error ? (
        <p className="html-md-converter-tool__error" role="status">
          {error}
        </p>
      ) : null}

      <HtmlMarkdownProjectPanel
        labels={labels}
        mode={mode}
        flavor={flavor}
        syncScroll={syncScroll}
        html={html}
        markdown={markdown}
      />

      <div className="html-md-converter-tool__workspace">
        <div className="html-md-converter-tool__columns">
          <div className="html-md-converter-tool__column tool-workspace-panel">
            {leftIsMarkdown ? renderMarkdownPanel(true, "left") : renderHtmlPanel(true, "left")}
          </div>

          <div className="html-md-converter-tool__column tool-workspace-panel">
            {rightIsHtml ? renderHtmlPanel(false, "right") : renderMarkdownPanel(false, "right")}
          </div>
        </div>

        <HtmlMarkdownSeoAuditPanel findings={seoFindings} labels={seoLabels} />
      </div>
    </div>
  );
}
