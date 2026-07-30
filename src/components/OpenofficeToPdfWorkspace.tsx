"use client";

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
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import {
  convertOpenofficeToPdfBytes,
  detectOpenofficeFormat,
  formatBytes,
  openofficeFormatLabel,
  openofficeToPdfOutputName,
  readOpenofficeMeta,
  type OpenofficeProgressPhase,
} from "@/lib/openoffice-to-pdf";
import {
  DELETE_PAGES_THUMB_SCALE,
  loadPdfPageCount,
  renderPdfPageThumbnail,
} from "@/lib/pdf-delete-pages";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { wsProgressPhase } from "@/lib/workspace-progress-label";
import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function copyPdfBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

function OpenOfficePreviewThumb({
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

export function OpenofficeToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [formatLabel, setFormatLabel] = useState("");
  const [fileReady, setFileReady] = useState(false);
  const [phase, setPhase] = useState<OpenofficeProgressPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [resultPageCount, setResultPageCount] = useState(0);
  const [resultName, setResultName] = useState("");
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const acceptOdf = useCallback((f: File) => Boolean(detectOpenofficeFormat(f)), []);
  const canConvert = Boolean(file && fileReady && !busy);
  const hasResult = Boolean(resultBytes && resultPageCount > 0);
  const pageIndices = hasResult
    ? Array.from({ length: resultPageCount }, (_, index) => index)
    : [];

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFormatLabel("");
    setFileReady(false);
    setPhase(null);
    setProgress(0);
    setStatus("");
    setDone(false);
    setRunError(null);
    setResultBytes(null);
    setResultPageCount(0);
    setResultName("");
    setPreviewPageIndex(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (picked: File) => {
    if (!acceptOdf(picked)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (picked.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }
    setFile(picked);
    setDone(false);
    setRunError(null);
    setPhase(null);
    setProgress(0);
    setFileReady(false);
    setFormatLabel("");
    setResultBytes(null);
    setResultPageCount(0);
    setResultName("");
    setPreviewPageIndex(null);
    setStatus(ws.wsStatus("readingStructure"));
    try {
      const meta = await readOpenofficeMeta(picked);
      setFormatLabel(meta.label);
      setFileReady(true);
      setStatus(
        ws.wsStatus("fileReadyMeta", {
          name: picked.name,
          format: meta.label,
          size: formatBytes(picked.size),
        }),
      );
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setFormatLabel("");
      setFileReady(false);
    }
  };

  const onConvert = async () => {
    if (!file || !fileReady || busy) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setResultBytes(null);
    setResultPageCount(0);
    setResultName("");
    setPreviewPageIndex(null);
    setPhase("extracting");
    setProgress(10);
    setStatus(ws.wsStatus("extracting"));

    try {
      const bytes = await convertOpenofficeToPdfBytes(file, (p, pct) => {
        setPhase(p);
        setProgress(pct);
        setStatus(wsProgressPhase(ws, p));
      });
      const stableBytes = copyPdfBytes(bytes);
      const pageCount = Math.max(1, await loadPdfPageCount(stableBytes));
      const outName = openofficeToPdfOutputName(file);
      setResultBytes(stableBytes);
      setResultPageCount(pageCount);
      setResultName(outName);
      setDone(true);
      setStatus(
        ws.wsStatus("readyPreview", { count: pageCount }) ||
          `Conversion ready — preview ${pageCount} page(s), then download.`,
      );
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      window.setTimeout(() => {
        dispatchToolComplete({ operation: tool.operation, slug });
        previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setPhase(null);
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

  const onDownload = () => {
    if (!resultBytes || !resultName) return;
    downloadBlob(new Blob([resultBytes as BlobPart], { type: "application/pdf" }), resultName);
    setStatus(ws.wsStatus("downloaded", { name: resultName }) || `Downloaded ${resultName}.`);
    capture(EVENTS.download_click, { operation: tool.operation, slug });
  };

  const progressPct = Math.min(100, Math.max(5, progress));

  return (
    <div id="tool-workspace" className="openoffice-pdf-workspace space-y-3 pb-12 md:pb-8">
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
                accept=".odt,.ods,.odp,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.presentation"
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
                {formatLabel ||
                  (detectOpenofficeFormat(file)
                    ? openofficeFormatLabel(detectOpenofficeFormat(file)!)
                    : "")}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">{ws.wsText("privacyNote")}</p>

          {busy ? (
            <WorkspaceProgressBar
              percent={progressPct}
              label={wsProgressPhase(ws, phase)}
            />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className={clsx(
                toolPrimaryBtn,
                "openoffice-pdf-btn openoffice-pdf-btn--primary",
                canConvert && "is-ready",
              )}
            >
              {hasResult
                ? ws.wsText("convertAgainLabel") || ws.wsText("convertLabel")
                : ws.wsText("convertLabel")}
            </button>
            {hasResult ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className={clsx(toolPrimaryBtn, "openoffice-pdf-btn openoffice-pdf-btn--primary is-ready")}
              >
                {ws.wsText("downloadLabel") || "Download PDF"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className={clsx(toolSecondaryBtn, "openoffice-pdf-btn openoffice-pdf-btn--secondary")}
            >
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
              className="openoffice-pdf-btn openoffice-pdf-btn--secondary"
            />
          </div>

          {hasResult && resultBytes ? (
            <div
              ref={previewPanelRef}
              className="visual-reorder-panel openoffice-pdf-preview"
              aria-labelledby={`${baseId}-preview-title`}
            >
              <div className="openoffice-pdf-preview__head">
                <h3 id={`${baseId}-preview-title`} className="openoffice-pdf-preview__title">
                  {ws.wsUi("previewHeading") || "PDF preview"}
                </h3>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDownload}
                  className={clsx(
                    toolPrimaryBtn,
                    "openoffice-pdf-btn openoffice-pdf-btn--primary is-ready",
                  )}
                >
                  {ws.wsText("downloadLabel") || "Download PDF"}
                </button>
              </div>
              <p className="visual-reorder-panel__hint">
                {ws.wsUi("previewHint") ||
                  "Preview converted pages below. Click a thumbnail to zoom, then download when ready."}
              </p>
              <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
                {pageIndices.map((pageIndex) => (
                  <OpenOfficePreviewThumb
                    key={`${resultName}-${pageIndex}`}
                    pageIndex={pageIndex}
                    fileBytes={resultBytes}
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

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDownload}
                  className={clsx(
                    toolPrimaryBtn,
                    "openoffice-pdf-btn openoffice-pdf-btn--primary is-ready",
                  )}
                >
                  {ws.wsText("downloadLabel") || "Download PDF"}
                </button>
              </div>

              <PdfPagePreviewModal
                open={previewPageIndex !== null}
                fileBytes={resultBytes}
                pageIndex={previewPageIndex ?? 0}
                password=""
                title={
                  previewPageIndex !== null
                    ? ws.wsCommon("pageOf", {
                        current: previewPageIndex + 1,
                        total: resultPageCount,
                      }) || `Page ${previewPageIndex + 1} of ${resultPageCount}`
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
            setStatus(file ? ws.wsStatus("tryAgain") : "");
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
          hasResult
            ? ws.wsText("downloadLabel") || ws.wsText("convertLabel")
            : file
              ? ws.wsText("convertLabel")
              : ws.wsText("stickyConvertLabel")
        }
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
