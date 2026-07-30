"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import * as pdf from "@/lib/pdf-engine";
import {
  DELETE_PAGES_THUMB_SCALE,
  renderPdfPageThumbnail,
} from "@/lib/pdf-delete-pages";
import { PDF_TO_PNG_SCALE } from "@/lib/pdf-to-png";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { zipBlobs } from "@/lib/zip-blobs";
import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const PNG_DOWNLOAD_BTN =
  "block w-full rounded-none border border-neutral-300 dark:border-neutral-800 bg-white px-3 py-1.5 text-center text-xs font-bold text-black dark:text-neutral-200 transition-colors hover:bg-neutral-900 hover:text-white dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900 dark:text-black dark:text-neutral-200 dark:hover:border-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

type ExportedPage = { page: number; blob: Blob; previewUrl: string };

function SourcePdfThumb({
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

function ExportThumb({
  entry,
  onDownload,
  pageLabel,
  downloadLabel,
}: {
  entry: ExportedPage;
  onDownload: (entry: ExportedPage) => void;
  pageLabel: string;
  downloadLabel: string;
}) {
  return (
    <div className="pdf-export-thumb">
      <div className="pdf-export-thumb__canvas-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URLs from export */}
        <img src={entry.previewUrl} alt={pageLabel} className="pdf-export-thumb__img" />
      </div>
      <div className="pdf-export-thumb__footer">
        <span className="pdf-export-thumb__label">{pageLabel}</span>
        <button
          type="button"
          className={`pdf-export-thumb__download ${PNG_DOWNLOAD_BTN}`}
          onClick={() => onDownload(entry)}
        >
          {downloadLabel}
        </button>
      </div>
    </div>
  );
}

export function PdfToPngWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const [pages, setPages] = useState<ExportedPage[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const previewUrlsRef = useRef<string[]>([]);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const revokePreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }, []);

  const reset = useCallback(() => {
    revokePreviews();
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPreviewPageIndex(null);
    setPages(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [revokePreviews]);

  useEffect(() => () => revokePreviews(), [revokePreviews]);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsCommon("choosePdf"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsCommon("emptyPdf"));
      return;
    }
    revokePreviews();
    setFile(next);
    setFileBytes(null);
    setPageCount(0);
    setPreviewPageIndex(null);
    setPages(null);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsCommon("loadingPdf") || ws.wsCommon("readingFile") || "Loading PDF…");
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const pdfjs = await import("pdfjs-dist");
      const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
      setFileBytes(bytes.slice());
      setPageCount(doc.numPages);
      setStatus(
        ws.wsStatus("fileReady", { name: next.name }) ||
          `${next.name} ready — preview pages, then export as PNG.`,
      );
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
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

  const onExport = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(
      ws.wsStatus("rendering", { count: pageCount, scale: PDF_TO_PNG_SCALE }) ||
        `Rendering ${pageCount} page(s)…`,
    );
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    revokePreviews();
    try {
      const rendered = await pdf.pdfToPngPages(file, PDF_TO_PNG_SCALE);
      const exported: ExportedPage[] = rendered.map((entry) => {
        const previewUrl = URL.createObjectURL(entry.blob);
        previewUrlsRef.current.push(previewUrl);
        return { page: entry.page, blob: entry.blob, previewUrl };
      });
      setPages(exported);
      setDone(true);
      setStatus(
        ws.wsStatus("exported", { count: exported.length }) ||
          `Exported ${exported.length} PNG page(s).`,
      );
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      window.setTimeout(() => {
        dispatchToolComplete({ operation: tool.operation, slug });
      }, 400);
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
    }
  };

  const onDownloadPage = (entry: ExportedPage) => {
    if (!file) return;
    downloadBlob(entry.blob, pdf.pdfToPngFileName(file, entry.page));
    capture(EVENTS.download_click, { operation: tool.operation, slug, page: entry.page });
  };

  const onDownloadZip = async () => {
    if (!file || !pages?.length) return;
    setBusy(true);
    setStatus(ws.wsCommon("processing"));
    try {
      const zip = await zipBlobs(
        pages.map((entry) => ({
          name: pdf.pdfToPngFileName(file, entry.page),
          blob: entry.blob,
        })),
      );
      downloadBlob(zip, pdf.pdfToPngZipName(file));
      setStatus(
        ws.wsStatus("zipDownloaded", { count: pages.length }) ||
          `Downloaded ZIP with ${pages.length} PNG file(s).`,
      );
      capture(EVENTS.download_click, { operation: tool.operation, slug, format: "zip" });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const showWorkspace = Boolean(file);
  const canExport = Boolean(file) && !busy;
  const hasPages = Boolean(pages?.length);
  const pageIndices =
    fileBytes && pageCount > 0 ? Array.from({ length: pageCount }, (_, index) => index) : [];

  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    void pickFile(next);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
    onRestoredStatus: setStatus,
  });

  return (
    <div
      id="tool-workspace"
      className="tool-workspace--wide pdf-to-png-workspace convert-tool-workspace--pdf-preview space-y-3 pb-12 md:pb-8"
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
            supportedFormats={["PDF"]}
            accept="application/pdf,.pdf"
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

      {showWorkspace ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="pdf-export-workspace tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {file ? pdf.formatBytes(file.size) : ""}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : null}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          {fileBytes && pageCount > 0 ? (
            <div
              ref={previewPanelRef}
              className="visual-reorder-panel convert-tool-preview"
              aria-labelledby={`${baseId}-preview-title`}
            >
              <h3 id={`${baseId}-preview-title`} className="convert-tool-preview__title">
                {ws.wsUi("previewHeading") || "PDF preview"}
              </h3>
              <p className="visual-reorder-panel__hint">
                {ws.wsUi("previewHint") ||
                  "Preview your PDF pages below. Click a thumbnail to zoom, then export as PNG when ready."}
              </p>
              <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
                {pageIndices.map((pageIndex) => (
                  <SourcePdfThumb
                    key={`${file?.name ?? "pdf"}-${pageIndex}`}
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

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
            <button
              type="button"
              disabled={!canExport}
              onClick={() => void onExport()}
              className={clsx(toolPrimaryBtn, "convert-tool-btn", canExport && "is-ready")}
            >
              {hasPages
                ? ws.wsText("reexportLabel") || "Re-export PNG pages"
                : ws.wsText("exportLabel") || "Export PNG pages"}
            </button>
            {hasPages ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDownloadZip()}
                className={clsx(toolPrimaryBtn, "convert-tool-btn is-ready")}
              >
                {ws.wsText("downloadZipLabel") || "Download all as ZIP"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className={clsx(toolSecondaryBtn, "convert-tool-btn convert-tool-btn--secondary")}
            >
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
              className="convert-tool-btn convert-tool-btn--secondary"
            />
          </div>

          {hasPages ? (
            <div className="pdf-export-grid" aria-label={ws.wsUi("gridLabel") || "Exported PNG pages"}>
              {pages!.map((entry) => (
                <ExportThumb
                  key={entry.page}
                  entry={entry}
                  onDownload={onDownloadPage}
                  pageLabel={ws.wsCommon("pageNumber", { page: entry.page })}
                  downloadLabel={ws.wsUi("downloadPng") || "Download PNG"}
                />
              ))}
            </div>
          ) : null}

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

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? ws.wsStatus("tryAgain") || "" : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={
          hasPages
            ? ws.wsText("stickyDownloadLabel") || "Download ZIP"
            : ws.wsText("stickyExportLabel") || "Export PNG"
        }
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
