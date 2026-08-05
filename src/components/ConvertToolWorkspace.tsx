"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { WorkspaceProjectControls } from "@/components/WorkspaceProjectControls";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useConsumePendingFiles } from "@/hooks/useConsumePendingFiles";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { formatsFromAcceptAttr } from "@/lib/upload-accept";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { PdfThumbCanvas } from "@/components/PdfThumbCanvas";
import { DELETE_PAGES_THUMB_SCALE } from "@/lib/pdf-delete-pages";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { formatBytes } from "@/lib/pdf-to-word";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
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

export type ConvertToolWorkspaceConfig<TProgress> = {
  accept: (file: File) => boolean;
  acceptAttr: string;
  /** Fallback when Workspaces keys are missing */
  dropTitle?: string;
  dropDescription?: string;
  invalidTypeMessage?: string;
  emptyFileMessage?: string;
  fileTypeLabel?: string;
  convertLabel?: string;
  downloadLabel?: string;
  outputHint?: string;
  stickyDownloadLabel?: string;
  stickyConvertLabel?: string;
  /** Optional override; defaults to Workspaces progress keys by phase */
  progressLabel?: (progress: TProgress | null) => string;
  progressPercent: (progress: TProgress | null, busy: boolean) => number;
  readMeta?: (file: File) => Promise<string>;
  /** When set, show interactive PDF page thumbnails + zoom lightbox after upload. */
  readPdfPreview?: (file: File) => Promise<{ bytes: Uint8Array; pageCount: number }>;
  convert: (file: File, onProgress: (p: TProgress) => void) => Promise<Blob>;
  outputName: (file: File) => string;
};

type ConvertToolWorkspaceProps<TProgress> = {
  tool: ToolDefinition;
  slug: string;
  config: ConvertToolWorkspaceConfig<TProgress>;
};

export function ConvertToolWorkspace<TProgress>({
  tool,
  slug,
  config,
}: ConvertToolWorkspaceProps<TProgress>) {
  const ws = useWorkspaceI18n(tool.operation);

  const invalidTypeMessage =
    config.invalidTypeMessage ?? ws.wsStatus("invalidType") ?? ws.wsCommon("choosePdf");
  const emptyFileMessage =
    config.emptyFileMessage ?? ws.wsStatus("emptyFile") ?? ws.wsCommon("emptyPdf");
  const fileTypeLabel = config.fileTypeLabel ?? ws.wsCommon("formatPdf");
  const convertLabel = config.convertLabel ?? ws.wsText("convertLabel") ?? ws.buttonLabel();
  const downloadLabel = config.downloadLabel ?? ws.wsText("downloadLabel") ?? ws.common("ready");
  const outputHint = config.outputHint ?? ws.wsText("outputHint");
  const stickyDownloadLabel =
    config.stickyDownloadLabel ?? ws.wsText("stickyDownloadLabel") ?? downloadLabel;
  const stickyConvertLabel =
    config.stickyConvertLabel ?? ws.wsText("stickyConvertLabel") ?? convertLabel;

  const labelProgress = (p: TProgress | null) => {
    if (config.progressLabel) return config.progressLabel(p);
    return progressLabelFromPhase(tool.operation, p, ws);
  };

  const [file, setFile] = useState<File | null>(null);
  const [metaLine, setMetaLine] = useState("");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<TProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();
  const showSourcePreview = Boolean(config.readPdfPreview);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setMetaLine("");
    setFileBytes(null);
    setPageCount(0);
    setPreviewPageIndex(null);
    setOutputBlob(null);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!config.accept(next)) {
      setStatus(invalidTypeMessage);
      return;
    }
    if (next.size === 0) {
      setStatus(emptyFileMessage);
      return;
    }
    setFile(next);
    setOutputBlob(null);
    setDone(false);
    setRunError(null);
    setFileBytes(null);
    setPageCount(0);
    setPreviewPageIndex(null);
    setStatus(ws.common("readingFile"));
    try {
      if (config.readPdfPreview) {
        const preview = await config.readPdfPreview(next);
        setFileBytes(preview.bytes.slice());
        setPageCount(preview.pageCount);
        setMetaLine(
          config.readMeta
            ? await config.readMeta(next)
            : formatPageCount(ws, preview.pageCount),
        );
      } else {
        const meta = config.readMeta ? await config.readMeta(next) : "";
        setMetaLine(meta);
      }
      const fileReady =
        ws.wsStatus("fileReady", { name: next.name }) ||
        ws.wsCommon("fileReadyAction", { name: next.name, action: convertLabel.toLowerCase() });
      setStatus(fileReady);
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
      if (config.readPdfPreview) {
        window.setTimeout(() => {
          previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 120);
      }
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setMetaLine("");
      setFileBytes(null);
      setPageCount(0);
    }
  };

  const pickFileRef = useRef(pickFile);
  pickFileRef.current = pickFile;

  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (next) void pickFileRef.current(next);
  }, []);

  useConsumePendingFiles(config.accept, (incoming) => {
    const next = incoming[0];
    if (!next) return;
    void pickFile(next);
  });

  const onConvert = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setOutputBlob(null);
    setStatus(ws.common("startingConversion"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await config.convert(file, (p) => {
        setProgress(p);
        setStatus(labelProgress(p));
      });
      setOutputBlob(blob);
      setDone(true);
      setStatus(ws.common("conversionComplete"));
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
      setProgress(null);
    }
  };

  const onDownload = () => {
    if (!file || !outputBlob) return;
    downloadBlob(outputBlob, config.outputName(file));
    capture(EVENTS.download_click, { operation: tool.operation, slug });
  };

  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const hasOutput = Boolean(outputBlob);
  const percent = config.progressPercent(progress, busy);
  const pageIndices =
    showSourcePreview && fileBytes && pageCount > 0
      ? Array.from({ length: pageCount }, (_, index) => index)
      : [];

  return (
    <div
      id="tool-workspace"
      className={clsx(
        "space-y-3 pb-12 md:pb-8",
        showSourcePreview && "convert-tool-workspace convert-tool-workspace--pdf-preview",
      )}
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
            title={ws.uploadTitle(config.dropTitle)}
            description={ws.uploadDescription(config.dropDescription)}
            supportedFormats={formatsFromAcceptAttr(config.acceptAttr)}
            accept={config.acceptAttr}
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
                accept={config.acceptAttr}
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
                {file ? formatBytes(file.size) : ""}
                {metaLine ? ` · ${metaLine}` : ""} · {fileTypeLabel}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          {showSourcePreview && fileBytes && pageCount > 0 ? (
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
                  "Preview your PDF pages below. Click a thumbnail to zoom, then convert when ready."}
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

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className={clsx(
                toolPrimaryBtn,
                "convert-tool-btn",
                canConvert && "is-ready",
              )}
            >
              {hasOutput ? ws.common("convertAgain") : convertLabel}
            </button>
            {hasOutput ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className={clsx(toolPrimaryBtn, "convert-tool-btn is-ready")}
              >
                {downloadLabel}
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
            <WorkspaceProjectControls
              toolSlug={slug}
              operation={tool.operation}
              files={file ? [file] : []}
              disabled={!file || busy}
              className="convert-tool-btn convert-tool-btn--secondary"
              onRestore={onRestoreProject}
              onRestoredStatus={setStatus}
            />
          </div>

          {hasOutput && file ? (
            <p className="text-sm text-ink-muted">
              {ws.common("ready")}{" "}
              <span className="font-medium text-ink">{config.outputName(file)}</span>
              {outputBlob ? ` (${formatBytes(outputBlob.size)})` : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{outputHint}</p>
          )}

          {showSourcePreview ? (
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
            setStatus(file ? ws.status("tryAgainOrChoose") : "");
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
        label={hasOutput ? stickyDownloadLabel : stickyConvertLabel}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
