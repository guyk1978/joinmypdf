"use client";

import { useEffect, useId, useState } from "react";
import { clsx } from "clsx";
import {
  buildHtmlPreviewDocument,
  convertHtmlToMarkdown,
  convertMarkdownToHtml,
  copyTextToClipboard,
  DEFAULT_MARKDOWN_SAMPLE,
  type HtmlMarkdownConverterMode,
} from "@/lib/html-markdown-converter";

export type HtmlMarkdownConverterLabels = {
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

  const [mode, setMode] = useState<HtmlMarkdownConverterMode>("markdown-to-html");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN_SAMPLE);
  const [html, setHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  useEffect(() => {
    if (mode !== "markdown-to-html") return;

    let cancelled = false;

    void convertMarkdownToHtml(markdown).then((result) => {
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
  }, [mode, markdown]);

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

  const renderHtmlPanel = (editable: boolean) => (
    <div className="html-md-converter-tool__pane">
      <div className="html-md-converter-tool__pane-header">
        <label className="html-md-converter-tool__label" htmlFor={editable ? htmlId : undefined}>
          {editable ? labels.htmlInputLabel : labels.htmlOutputLabel}
        </label>
        <div className="html-md-converter-tool__pane-actions">
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

      {previewOpen && html.trim() ? (
        <iframe
          className="html-md-converter-tool__preview"
          title={labels.previewButton}
          sandbox=""
          srcDoc={buildHtmlPreviewDocument(html)}
        />
      ) : editable ? (
        <textarea
          id={htmlId}
          className="html-md-converter-tool__textarea"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          placeholder={labels.htmlPlaceholder}
          spellCheck={false}
          rows={18}
        />
      ) : (
        <pre className="html-md-converter-tool__code" aria-live="polite">
          {html || "\u00a0"}
        </pre>
      )}
    </div>
  );

  const renderMarkdownPanel = (editable: boolean) => (
    <div className="html-md-converter-tool__pane">
      <div className="html-md-converter-tool__pane-header">
        <label className="html-md-converter-tool__label" htmlFor={editable ? markdownId : undefined}>
          {editable ? labels.markdownInputLabel : labels.markdownOutputLabel}
        </label>
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

      {editable ? (
        <textarea
          id={markdownId}
          className="html-md-converter-tool__textarea"
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          placeholder={labels.markdownPlaceholder}
          spellCheck={false}
          rows={18}
        />
      ) : (
        <pre className="html-md-converter-tool__code" aria-live="polite">
          {markdown || "\u00a0"}
        </pre>
      )}
    </div>
  );

  return (
    <div className={clsx("html-md-converter-tool", className)}>
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
      </div>

      {error ? (
        <p className="html-md-converter-tool__error" role="status">
          {error}
        </p>
      ) : null}

      <div className="html-md-converter-tool__columns">
        <div className="html-md-converter-tool__column tool-workspace-panel">
          {leftIsMarkdown ? renderMarkdownPanel(true) : renderHtmlPanel(true)}
        </div>

        <div className="html-md-converter-tool__column tool-workspace-panel">
          {rightIsHtml ? renderHtmlPanel(false) : renderMarkdownPanel(false)}
        </div>
      </div>
    </div>
  );
}
