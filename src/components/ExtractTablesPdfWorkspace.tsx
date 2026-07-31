"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

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
  extractTablesFromPdf,
  extractTablesPdfOutputName,
  type ExtractTablesPdfProgress,
  type TableOutputFormat,
} from "@/lib/extract-tables-pdf";
import {
  DELETE_PAGES_THUMB_SCALE,
  renderPdfPageThumbnail,
} from "@/lib/pdf-delete-pages";
import { loadPdfDocument } from "@/lib/pdf-text-extract";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolOutlineBtn, toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import { clsx } from "clsx";
import { ZoomIn } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const OUTPUT_FORMATS: TableOutputFormat[] = ["csv", "xlsx"];

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(progress: ExtractTablesPdfProgress | null, busy: boolean): number {
  if (!progress || progress.totalPages <= 0) {
    return busy ? 10 : 0;
  }
  if (progress.phase === "loading") return 12;
  if (progress.phase === "building") return 95;
  return Math.min(90, Math.round((progress.currentPage / progress.totalPages) * 90));
}

function TablesPageThumb({
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    void renderPdfPageThumbnail(fileBytes, pageIndex, "", DELETE_PAGES_THUMB_SCALE).then(
      (canvas) => {
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, visible]);

  return (
    <div className="extract-tables-thumb" role="listitem">
      <span className="extract-tables-thumb__index" aria-hidden>
        {pageIndex + 1}
      </span>
      <button
        type="button"
        className="extract-tables-thumb__preview"
        data-pdf-page-preview=""
        aria-label={previewAria}
        onClick={onPreview}
      >
        <div ref={wrapRef} className="extract-tables-thumb__canvas-wrap">
          {loading || !visible ? (
            <p className="extract-tables-thumb__loading">{loadingLabel}</p>
          ) : null}
          <canvas ref={canvasRef} className="extract-tables-thumb__canvas" />
        </div>
        <span className="extract-tables-thumb__label">{pageLabel}</span>
      </button>
      <button
        type="button"
        className="extract-tables-thumb__zoom"
        aria-label={previewAria}
        title={previewAria}
        onClick={onPreview}
      >
        <ZoomIn size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

export function ExtractTablesPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: ExtractTablesPdfProgress | null) => {
    if (!p) return "";
    if (p.phase === "parsing" && typeof p.tablesFound === "number" && p.tablesFound > 0) {
      return ws.wsProgress("parsingWithTables", {
        current: p.currentPage,
        total: p.totalPages,
        count: p.tablesFound,
      });
    }
    return progressLabelFromPhase(tool.operation, p, ws);
  };
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<TableOutputFormat>("xlsx");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<ExtractTablesPdfProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

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
    setPreviewPageIndex(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = useCallback(
    async (next: File) => {
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
      setPreviewPageIndex(null);
      setStatus(ws.wsCommon("readingFile"));
      try {
        const bytes = new Uint8Array(await next.arrayBuffer());
        const doc = await loadPdfDocument(next);
        setFile(next);
        setFileBytes(bytes);
        setPageCount(doc.numPages);
        setStatus(ws.wsStatus("fileReady", { name: next.name }));
        capture(EVENTS.file_selected, { operation: tool.operation });
      } catch (e) {
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setStatus("");
        setFile(null);
        setFileBytes(null);
        setPageCount(0);
      }
    },
    [acceptPdf, tool.operation, ws],
  );

  const runExtract = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, format });

    let tableCount = 0;
    try {
      const blob = await extractTablesFromPdf(file, format, (p) => {
        if (typeof p.tablesFound === "number") tableCount = p.tablesFound;
        setProgress(p);
      });
      const multipleTables = format === "csv" && blob.type.includes("zip");
      const outName = extractTablesPdfOutputName(file, format, multipleTables);
      downloadBlob(blob, outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName, count: tableCount || 1 }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, format });
      capture(EVENTS.download_click, { operation: tool.operation, slug, format });
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

  const canExtract = Boolean(file && !busy);
  const percent = progressPercent(progress, busy);
  const showWorkspace = Boolean(file);
  const pageIndices = useMemo(
    () => (pageCount > 0 ? Array.from({ length: pageCount }, (_, i) => i) : []),
    [pageCount],
  );

  const onRestoreProject = useCallback(
    (payload: { files: File[] }) => {
      const next = payload.files[0];
      if (!next) return;
      void pickFile(next);
    },
    [pickFile],
  );

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    settings: { format },
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  return (
    <div
      id="tool-workspace"
      className="extract-tables-pdf-tool-page tool-workspace--wide space-y-3 pb-12 md:pb-8"
    >
      <WorkspaceUploadShell active={showWorkspace}>
        {!showWorkspace ? (
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
        ) : (
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
        )}
      </WorkspaceUploadShell>

      {showWorkspace && file ? (
        <div
          id={WORKSPACE_OPERATIONS_ID}
          className="tool-workspace-panel extract-tables-panel space-y-4"
          data-embed-measure=""
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-100">{file.name}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {pdf.formatBytes(file.size)}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : ""}
              </p>
              {status ? <p className="mt-1 text-xs text-neutral-400">{status}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={reset} className={toolOutlineBtn}>
                {ws.chooseAnotherFile}
              </button>
              <WorkspaceNewUploadButton
                label={ws.uploadNewFile}
                disabled={busy}
                onClick={() => startNewUpload(reset)}
              />
            </div>
          </div>

          {fileBytes && pageCount > 0 ? (
            <div className="extract-tables-preview">
              <p className="extract-tables-preview__hint">
                {ws.wsUi("previewHint") ||
                  "Preview PDF pages below. Click a thumbnail or zoom icon for a larger view, then extract tables."}
              </p>
              <div
                className="extract-tables-grid"
                role="list"
                aria-label={ws.wsUi("gridLabel") || "PDF page previews"}
              >
                {pageIndices.map((pageIndex) => (
                  <TablesPageThumb
                    key={pageIndex}
                    pageIndex={pageIndex}
                    fileBytes={fileBytes}
                    loadingLabel={ws.wsUi("loadingThumb") || ws.wsCommon("loadingPreview") || "Loading…"}
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

              <PdfPagePreviewModal
                open={previewPageIndex !== null}
                fileBytes={fileBytes}
                pageIndex={previewPageIndex ?? 0}
                title={
                  previewPageIndex !== null
                    ? ws.wsCommon("pageOf", {
                        current: previewPageIndex + 1,
                        total: pageCount,
                      }) || `Page ${previewPageIndex + 1} of ${pageCount}`
                    : ""
                }
                closeLabel={ws.wsCommon("closePagePreview") || "Close page preview"}
                loadingLabel={ws.wsCommon("loadingPagePreview") || ws.wsUi("loadingThumb") || "Loading…"}
                zoomInLabel={ws.wsUi("zoomIn") || ws.wsCommon("zoomIn") || "Zoom in"}
                zoomOutLabel={ws.wsUi("zoomOut") || ws.wsCommon("zoomOut") || "Zoom out"}
                onClose={() => setPreviewPageIndex(null)}
              />
            </div>
          ) : null}

          <fieldset className="extract-tables-format">
            <legend className="extract-tables-format__legend">{ws.wsUi("formatLegend")}</legend>
            <div className="extract-tables-format__options" role="radiogroup" aria-label={ws.wsUi("formatLegend")}>
              {OUTPUT_FORMATS.map((value) => (
                <label
                  key={value}
                  className={clsx(
                    "extract-tables-format__option",
                    format === value && "is-active",
                  )}
                >
                  <input
                    type="radio"
                    name={`${baseId}-format`}
                    value={value}
                    checked={format === value}
                    disabled={busy}
                    onChange={() => setFormat(value)}
                  />
                  <span className="extract-tables-format__option-label">
                    {value === "csv"
                      ? ws.wsUi("formatCsvShort") || "CSV / ZIP"
                      : ws.wsUi("formatXlsxShort") || "Excel (.xlsx)"}
                  </span>
                </label>
              ))}
            </div>
            <p className="extract-tables-format__hint">{ws.wsUi("formatHint")}</p>
          </fieldset>

          <div className="extract-tables-actions flex flex-wrap items-center gap-3" data-workspace-actions="">
            <button
              type="button"
              className={toolPrimaryBtn}
              disabled={!canExtract}
              onClick={() => void runExtract()}
            >
              {busy ? ws.wsText("extractingLabel") : ws.wsText("extractLabel")}
            </button>
            {done ? (
              <button
                type="button"
                className={toolSecondaryBtn}
                disabled={busy}
                onClick={() => void runExtract()}
              >
                {ws.wsText("extractAgainLabel")}
              </button>
            ) : null}
          </div>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          {runError ? (
            <ToolErrorRecovery
              operation={tool.operation}
              slug={slug}
              kind={runError.kind}
              technicalMessage={runError.message}
              onDismiss={() => setRunError(null)}
            />
          ) : null}

          <p className="text-xs text-neutral-500">{ws.wsText("privacyNote")}</p>
        </div>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("extractLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
