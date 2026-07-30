"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  convertPdfToEbook,
  pdfToEbookOutputName,
  type EbookOutputFormat,
  type PdfToEbookProgress,
} from "@/lib/pdf-to-epub";
import {
  DELETE_PAGES_THUMB_SCALE,
  renderPdfPageThumbnail,
} from "@/lib/pdf-delete-pages";
import { loadPdfDocument } from "@/lib/pdf-text-extract";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const OUTPUT_FORMATS: EbookOutputFormat[] = ["epub", "mobi"];

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(progress: PdfToEbookProgress | null, busy: boolean): number {
  if (!progress || progress.totalPages <= 0) {
    return busy ? 10 : 0;
  }
  const phaseWeight =
    progress.phase === "loading"
      ? 0.1
      : progress.phase === "extracting"
        ? 0.45
        : progress.phase === "rendering"
          ? 0.75
          : 1;
  const pageRatio = progress.currentPage / progress.totalPages;
  return Math.min(100, Math.round((phaseWeight * 0.25 + pageRatio * 0.75) * 100));
}

function EbookSourceThumb({
  pageIndex,
  fileBytes,
  loadingLabel,
  pageLabel,
  previewAria,
  onPreview,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  loadingLabel: string;
  pageLabel: string;
  previewAria: string;
  onPreview: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void renderPdfPageThumbnail(fileBytes, pageIndex, "", DELETE_PAGES_THUMB_SCALE)
      .then((canvas) => {
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex]);

  return (
    <div className="page-manage-thumb visual-reorder-card visual-reorder-card--page" role="listitem">
      <span className="visual-reorder-card__index">{pageLabel}</span>
      <button
        type="button"
        className="page-manage-thumb__preview-btn"
        data-pdf-page-preview=""
        aria-label={previewAria}
        onClick={onPreview}
      >
        <div className="page-manage-thumb__canvas-wrap delete-page-thumb__canvas-wrap">
          {loading ? (
            <p className="page-manage-thumb__loading delete-page-thumb__loading">{loadingLabel}</p>
          ) : null}
          {failed ? (
            <p className="page-manage-thumb__loading delete-page-thumb__loading">{pageLabel}</p>
          ) : null}
          <canvas
            ref={canvasRef}
            className="page-manage-thumb__canvas delete-page-thumb__canvas"
            hidden={loading || failed}
          />
        </div>
      </button>
    </div>
  );
}

export function PdfToEpubWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: PdfToEbookProgress | null) => progressLabelFromPhase(tool.operation, p, ws);
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<EbookOutputFormat>("epub");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<PdfToEbookProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);
  const canConvert = Boolean(file && fileBytes && !busy);
  const canDownload = Boolean(resultBlob && resultName && !busy);
  const pageIndices =
    fileBytes && pageCount > 0
      ? Array.from({ length: pageCount }, (_, index) => index)
      : [];

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    setResultBlob(null);
    setResultName("");
    setPreviewPageIndex(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }
    setDone(false);
    setRunError(null);
    setResultBlob(null);
    setResultName("");
    setPreviewPageIndex(null);
    setFile(next);
    setFileBytes(null);
    setPageCount(0);
    setStatus(ws.wsCommon("readingFile"));
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const doc = await loadPdfDocument(next);
      setFileBytes(bytes.slice());
      setPageCount(doc.numPages);
      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation });
      window.setTimeout(() => {
        previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setFileBytes(null);
      setPageCount(0);
    }
  };

  const runConvert = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setResultBlob(null);
    setResultName("");
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, format });

    try {
      const blob = await convertPdfToEbook(file, { format }, setProgress);
      const outName = pdfToEbookOutputName(file, format);
      setResultBlob(blob);
      setResultName(outName);
      setDone(true);
      setStatus(
        ws.wsStatus("readyDownload", { name: outName }) ||
          `Conversion ready — download ${outName} when you are set.`,
      );
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, format });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      capture(EVENTS.tool_run_error, {
        operation: tool.operation,
        slug,
        message: parsed.message,
        kind: parsed.kind,
      });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const onDownload = () => {
    if (!resultBlob || !resultName) return;
    downloadBlob(resultBlob, resultName);
    setStatus(ws.wsStatus("downloaded", { name: resultName }));
    capture(EVENTS.download_click, { operation: tool.operation, slug, format });
  };

  const percent = progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="pdf-to-epub-workspace space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={Boolean(file)}>
        {!file ? (
          <FileUploadZone
            operation={tool.operation}
            drag={drag}
            role="button"
            tabIndex={0}
            aria-controls={`${baseId}-input`}
            className="cursor-pointer"
            title={ws.uploadTitle()}
            description={ws.uploadDescription()}
            onKeyDown={(e: ReactKeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const picked = e.dataTransfer.files?.[0];
              if (picked) void pickFile(picked);
            }}
            onClick={() => inputRef.current?.click()}
            input={
              <input
                id={`${baseId}-input`}
                ref={inputRef}
                type="file"
                className="sr-only"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) void pickFile(picked);
                  e.target.value = "";
                }}
              />
            }
          />
        ) : null}
      </WorkspaceUploadShell>

      {file ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {pdf.formatBytes(file.size)}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : ""}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">{ws.wsText("privacyNote")}</p>

          {fileBytes && pageCount > 0 ? (
            <div
              ref={previewPanelRef}
              className="visual-reorder-panel pdf-to-epub-preview"
              aria-labelledby={`${baseId}-preview-title`}
            >
              <h3 id={`${baseId}-preview-title`} className="pdf-to-epub-preview__title">
                {ws.wsUi("previewHeading") || "PDF preview"}
              </h3>
              <p className="visual-reorder-panel__hint">
                {ws.wsUi("previewHint") ||
                  "Preview your PDF pages below. Click a thumbnail to zoom, then choose EPUB or MOBI and convert."}
              </p>
              <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
                {pageIndices.map((pageIndex) => (
                  <EbookSourceThumb
                    key={`${file.name}-${pageIndex}`}
                    pageIndex={pageIndex}
                    fileBytes={fileBytes}
                    loadingLabel={ws.wsUi("loadingThumb") || ws.wsCommon("loading") || "Loading…"}
                    pageLabel={
                      ws.wsCommon("pageNumber", { page: pageIndex + 1 }) || `Page ${pageIndex + 1}`
                    }
                    previewAria={
                      ws.wsCommon("openPagePreview", { page: pageIndex + 1 }) ||
                      `Open larger preview of page ${pageIndex + 1}`
                    }
                    onPreview={() => setPreviewPageIndex(pageIndex)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <fieldset className="space-y-2 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {ws.wsUi("formatLegend")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_FORMATS.map((value) => (
                <label
                  key={value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-neutral-800 bg-black px-3 py-2 text-sm text-neutral-200"
                >
                  <input
                    type="radio"
                    name={`${baseId}-format`}
                    value={value}
                    checked={format === value}
                    disabled={busy}
                    onChange={() => {
                      setFormat(value);
                      setResultBlob(null);
                      setResultName("");
                      setDone(false);
                    }}
                    className="accent-white"
                  />
                  <span>{ws.wsUi(`format_${value}`)}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-muted">{ws.wsUi("formatHint")}</p>
          </fieldset>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={clsx(toolPrimaryBtn, "pdf-to-epub-btn", canConvert && "is-ready")}
              disabled={!canConvert}
              onClick={() => void runConvert()}
            >
              {busy
                ? ws.wsText("convertingLabel")
                : done
                  ? ws.wsText("convertAgainLabel")
                  : ws.wsText("convertLabel")}
            </button>
            <button
              type="button"
              className={clsx(toolPrimaryBtn, "pdf-to-epub-btn", canDownload && "is-ready")}
              disabled={!canDownload}
              onClick={onDownload}
            >
              {ws.wsText("downloadLabel") || "Download"}
            </button>
            <button
              type="button"
              className={clsx(toolSecondaryBtn, "pdf-to-epub-btn pdf-to-epub-btn--secondary")}
              disabled={busy}
              onClick={reset}
            >
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
              className="pdf-to-epub-btn pdf-to-epub-btn--secondary"
            />
          </div>

          {runError ? (
            <ToolErrorRecovery
              operation={tool.operation}
              slug={slug}
              kind={runError.kind}
              technicalMessage={runError.message}
              onDismiss={() => setRunError(null)}
            />
          ) : (
            <p className="text-sm text-ink-muted" role="status" aria-live="polite">
              {status}
            </p>
          )}

          <PdfPagePreviewModal
            open={previewPageIndex !== null}
            fileBytes={fileBytes}
            pageIndex={previewPageIndex ?? 0}
            password=""
            title={
              previewPageIndex !== null
                ? ws.wsCommon("pageOf", {
                    current: previewPageIndex + 1,
                    total: pageCount,
                  }) || `Page ${previewPageIndex + 1} of ${pageCount}`
                : ""
            }
            closeLabel={ws.wsCommon("closePagePreview") || "Close page preview"}
            loadingLabel={
              ws.wsCommon("loadingPagePreview") ||
              ws.wsUi("loadingThumb") ||
              "Loading preview…"
            }
            zoomInLabel={ws.wsUi("zoomIn") || "Zoom in"}
            zoomOutLabel={ws.wsUi("zoomOut") || "Zoom out"}
            onClose={() => setPreviewPageIndex(null)}
          />
        </div>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={
          canDownload
            ? ws.wsText("downloadLabel") || ws.wsText("convertLabel")
            : ws.wsText("convertLabel")
        }
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
