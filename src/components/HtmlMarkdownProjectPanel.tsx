"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { copyTextToClipboard } from "@/lib/html-markdown-converter";
import type { HtmlMarkdownConverterMode } from "@/lib/html-markdown-converter";
import {
  batchConvertFiles,
  buildCopyToProjectSnippet,
  buildGistClipboardPayload,
  downloadBatchZip,
  loadProjectConfig,
  openGistEditor,
  saveProjectConfig,
  type HtmlMarkdownProjectConfig,
} from "@/lib/html-markdown-project";

export type HtmlMarkdownProjectLabels = {
  projectSectionTitle: string;
  projectSectionHint: string;
  minifyHtmlLabel: string;
  includeCssLabel: string;
  saveConfigButton: string;
  configSaved: string;
  copyToProjectButton: string;
  gistExportButton: string;
  gistCopied: string;
  batchLabel: string;
  batchHint: string;
  batchConvertButton: string;
  batchDownloadZip: string;
  batchResults: string;
  batchEmpty: string;
  batchProcessing: string;
};

type HtmlMarkdownProjectPanelProps = {
  labels: HtmlMarkdownProjectLabels;
  mode: HtmlMarkdownConverterMode;
  flavor: HtmlMarkdownProjectConfig["flavor"];
  syncScroll: boolean;
  html: string;
  markdown: string;
  className?: string;
};

export function HtmlMarkdownProjectPanel({
  labels,
  mode,
  flavor,
  syncScroll,
  html,
  markdown,
  className,
}: HtmlMarkdownProjectPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [minifyHtml, setMinifyHtml] = useState(() => loadProjectConfig().minifyHtml);
  const [includeCssBoilerplate, setIncludeCssBoilerplate] = useState(
    () => loadProjectConfig().includeCssBoilerplate,
  );
  const [configSaved, setConfigSaved] = useState(false);
  const [gistCopied, setGistCopied] = useState(false);
  const [batchCount, setBatchCount] = useState<number | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [lastBatchResults, setLastBatchResults] = useState<Awaited<
    ReturnType<typeof batchConvertFiles>
  > | null>(null);

  const onSaveConfig = () => {
    saveProjectConfig({ flavor, minifyHtml, includeCssBoilerplate, syncScroll });
    setConfigSaved(true);
    window.setTimeout(() => setConfigSaved(false), 1600);
  };

  const onCopyToProject = async () => {
    if (!html.trim()) return;
    await copyTextToClipboard(buildCopyToProjectSnippet(html, { minifyHtml, includeCssBoilerplate }));
  };

  const onGistExport = async () => {
    const payload = buildGistClipboardPayload(markdown);
    const success = await copyTextToClipboard(payload);
    if (success) {
      setGistCopied(true);
      window.setTimeout(() => setGistCopied(false), 1600);
    }
    openGistEditor();
  };

  const onBatchConvert = async (files: FileList | null) => {
    if (!files?.length) return;
    setBatchBusy(true);
    setBatchCount(null);
    const direction = mode === "markdown-to-html" ? "md-to-html" : "html-to-md";
    const config: HtmlMarkdownProjectConfig = {
      flavor,
      minifyHtml,
      includeCssBoilerplate,
      syncScroll,
    };
    const results = await batchConvertFiles(Array.from(files), direction, config);
    setLastBatchResults(results);
    const ok = results.filter((r) => r.output && !r.error).length;
    setBatchCount(ok);
    setBatchBusy(false);
  };

  const onDownloadZip = async () => {
    if (!lastBatchResults?.length) return;
    await downloadBatchZip(lastBatchResults);
  };

  return (
    <section className={clsx("html-md-converter-tool__project tool-workspace-panel", className)}>
      <div className="html-md-converter-tool__project-header">
        <h3 className="html-md-converter-tool__project-title">{labels.projectSectionTitle}</h3>
        <p className="html-md-converter-tool__project-hint">{labels.projectSectionHint}</p>
      </div>

      <div className="html-md-converter-tool__project-options">
        <label className="html-md-converter-tool__sync-toggle">
          <input
            type="checkbox"
            className="html-md-converter-tool__sync-input"
            checked={minifyHtml}
            onChange={(event) => setMinifyHtml(event.target.checked)}
          />
          <span>{labels.minifyHtmlLabel}</span>
        </label>
        <label className="html-md-converter-tool__sync-toggle">
          <input
            type="checkbox"
            className="html-md-converter-tool__sync-input"
            checked={includeCssBoilerplate}
            onChange={(event) => setIncludeCssBoilerplate(event.target.checked)}
          />
          <span>{labels.includeCssLabel}</span>
        </label>
      </div>

      <div className="html-md-converter-tool__project-actions">
        <button type="button" className="html-md-converter-tool__copy-btn" onClick={onSaveConfig}>
          {configSaved ? labels.configSaved : labels.saveConfigButton}
        </button>
        <button
          type="button"
          className="html-md-converter-tool__copy-btn"
          onClick={() => void onCopyToProject()}
          disabled={!html.trim()}
        >
          {labels.copyToProjectButton}
        </button>
        <button
          type="button"
          className="html-md-converter-tool__copy-btn"
          onClick={() => void onGistExport()}
          disabled={!markdown.trim()}
        >
          {gistCopied ? labels.gistCopied : labels.gistExportButton}
        </button>
      </div>

      <div className="html-md-converter-tool__batch">
        <p className="html-md-converter-tool__batch-label">{labels.batchLabel}</p>
        <p className="html-md-converter-tool__batch-hint">{labels.batchHint}</p>
        <input
          ref={fileInputRef}
          type="file"
          className="html-md-converter-tool__batch-input"
          multiple
          accept={mode === "markdown-to-html" ? ".md,.markdown,text/markdown" : ".html,.htm,text/html"}
          onChange={(event) => void onBatchConvert(event.target.files)}
        />
        <div className="html-md-converter-tool__project-actions">
          <button
            type="button"
            className="html-md-converter-tool__copy-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={batchBusy}
          >
            {batchBusy ? labels.batchProcessing : labels.batchConvertButton}
          </button>
          <button
            type="button"
            className="html-md-converter-tool__copy-btn"
            onClick={() => void onDownloadZip()}
            disabled={!lastBatchResults?.some((r) => r.output && !r.error)}
          >
            {labels.batchDownloadZip}
          </button>
        </div>
        {batchCount !== null ? (
          <p className="html-md-converter-tool__batch-status" role="status">
            {batchCount > 0
              ? labels.batchResults.replace("{count}", String(batchCount))
              : labels.batchEmpty}
          </p>
        ) : null}
      </div>
    </section>
  );
}
