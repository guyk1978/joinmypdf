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
  convertPdfToPdfAFromFile,
  pdfAConverterOutputName,
  type PdfAConvertProgress,
  type PdfAProfile,
} from "@/lib/pdf-a-convert";
import { PdfThumbCanvas } from "@/components/PdfThumbCanvas";
import {
  DELETE_PAGES_THUMB_SCALE,
  loadPdfPageCount,
} from "@/lib/pdf-delete-pages";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
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

function progressPercent(progress: PdfAConvertProgress | null, busy: boolean): number {
  if (!progress || progress.totalPages <= 0) {
    return busy ? 12 : 0;
  }

  const phaseWeight =
    progress.phase === "loading"
      ? 0.1
      : progress.phase === "normalizing"
        ? 0.65
        : progress.phase === "metadata"
          ? 0.85
          : 1;

  const pageRatio = progress.currentPage / progress.totalPages;
  return Math.min(100, Math.round((phaseWeight * 0.35 + pageRatio * 0.65) * 100));
}

function PdfAPreviewThumb({
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
  const tCommon = useTranslations("Workspaces.common");
  const failedLabel = tCommon.has("previewFailed")
    ? tCommon("previewFailed")
    : "Could not render this page.";

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
        <PdfThumbCanvas
          fileBytes={fileBytes}
          pageIndex={pageIndex}
          scale={DELETE_PAGES_THUMB_SCALE}
          loadingLabel={loadingLabel}
          failedLabel={failedLabel}
          wrapClassName="delete-page-thumb__canvas-wrap"
          canvasClassName="delete-page-thumb__canvas"
          loadingClassName="delete-page-thumb__loading"
        />
      </button>
    </div>
  );
}

export function PdfAConverterWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: PdfAConvertProgress | null) =>
    progressLabelFromPhase(tool.operation, p, ws);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [profile, setProfile] = useState<PdfAProfile>("pdfa-1b");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<PdfAConvertProgress | null>(null);
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

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);
  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const hasResult = Boolean(resultBytes && resultPageCount > 0);
  const percent = progressPercent(progress, busy);
  const pageIndices = hasResult
    ? Array.from({ length: resultPageCount }, (_, index) => index)
    : [];

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setProfile("pdfa-1b");
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    setResultBytes(null);
    setResultPageCount(0);
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

    setFile(next);
    setDone(false);
    setRunError(null);
    setResultBytes(null);
    setResultPageCount(0);
    setResultName("");
    setPreviewPageIndex(null);
    setStatus(ws.wsCommon("readingPdf"));

    try {
      const pdfjs = await import("pdfjs-dist");
      const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      const url = URL.createObjectURL(next);
      try {
        const doc = await pdfjs.getDocument({ url }).promise;
        setPageCount(doc.numPages);
      } finally {
        URL.revokeObjectURL(url);
      }

      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const onConvert = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setResultBytes(null);
    setResultPageCount(0);
    setResultName("");
    setPreviewPageIndex(null);
    setProgress({ phase: "loading", currentPage: 0, totalPages: pageCount });
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await convertPdfToPdfAFromFile(file, {
        profile,
        onProgress: (p) => {
          setProgress(p);
          setStatus(labelProgress(p));
        },
      });
      const stableBytes = bytes.slice();
      const outPages = Math.max(
        1,
        pageCount || (await loadPdfPageCount(stableBytes)),
      );
      const outName = pdfAConverterOutputName(file, profile);
      setResultBytes(stableBytes);
      setResultPageCount(outPages);
      setResultName(outName);
      setDone(true);
      setStatus(
        ws.wsStatus("readyPreview", { count: outPages }) ||
          `PDF/A ready — preview ${outPages} page(s), then download.`,
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
    if (!resultBytes || !resultName) return;
    downloadBlob(new Blob([resultBytes as BlobPart], { type: "application/pdf" }), resultName);
    setStatus(ws.wsStatus("downloaded", { name: resultName }));
    capture(EVENTS.download_click, { operation: tool.operation, slug });
  };


  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    void pickFile(next);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  return (
    <div id="tool-workspace" className="pdfa-converter-workspace space-y-3 pb-12 md:pb-8">
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
        ) : null}
      </WorkspaceUploadShell>

      {showWorkspace ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {file ? pdf.formatBytes(file.size) : ""}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : ""}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">{ws.wsText("privacyNote")}</p>

          <fieldset className="space-y-2 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {ws.wsUi("profileLegend")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {(["pdfa-1b", "pdfa-2b"] as const).map((value) => (
                <label
                  key={value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-neutral-800 bg-black px-3 py-2 text-sm text-neutral-200"
                >
                  <input
                    type="radio"
                    name={`${baseId}-profile`}
                    value={value}
                    checked={profile === value}
                    disabled={busy}
                    onChange={() => {
                      setProfile(value);
                      setResultBytes(null);
                      setResultPageCount(0);
                      setResultName("");
                      setPreviewPageIndex(null);
                      setDone(false);
                    }}
                    className="accent-white"
                  />
                  <span>{ws.wsUi(value === "pdfa-1b" ? "profile1b" : "profile2b")}</span>
                </label>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">{ws.wsUi("profileHint")}</p>
          </fieldset>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className={clsx(toolPrimaryBtn, canConvert && "pdfa-btn--ready")}
            >
              {hasResult ? ws.wsText("convertAgainLabel") : ws.wsText("convertLabel")}
            </button>
            {hasResult ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className={clsx(toolPrimaryBtn, "pdfa-btn--ready")}
              >
                {ws.wsText("downloadLabel") || "Download PDF/A"}
              </button>
            ) : null}
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>

          {hasResult && resultBytes ? (
            <div
              ref={previewPanelRef}
              className="visual-reorder-panel pdfa-preview"
              aria-labelledby={`${baseId}-preview-title`}
            >
              <div className="pdfa-preview__head">
                <h3 id={`${baseId}-preview-title`} className="pdfa-preview__title">
                  {ws.wsUi("previewHeading") || "PDF/A preview"}
                </h3>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDownload}
                  className={clsx(toolPrimaryBtn, "pdfa-btn--ready")}
                >
                  {ws.wsText("downloadLabel") || "Download PDF/A"}
                </button>
              </div>
              <p className="visual-reorder-panel__hint">
                {ws.wsUi("previewHint") ||
                  "Preview PDF/A pages below. Click a thumbnail to zoom, then download when ready."}
              </p>
              <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
                {pageIndices.map((pageIndex) => (
                  <PdfAPreviewThumb
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
                  className={clsx(toolPrimaryBtn, "pdfa-btn--ready")}
                >
                  {ws.wsText("downloadLabel") || "Download PDF/A"}
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
            setStatus(file ? ws.wsText("tryAgain") || ws.wsStatus("tryAgain") || "" : "");
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
            : ws.wsText("convertLabel")
        }
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
