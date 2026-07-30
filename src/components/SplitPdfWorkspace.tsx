"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useConsumePendingFiles } from "@/hooks/useConsumePendingFiles";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { DELETE_PAGES_THUMB_SCALE, renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
import {
  breaksAfterFromSegments,
  formatSplitSegmentsSpec,
  parseSplitPartitionSpec,
  segmentsFromBreaksAfter,
  splitPdfPartName,
  splitPdfZipName,
} from "@/lib/pdf-pages";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { zipBlobs } from "@/lib/zip-blobs";
import { Scissors } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import "./split-pdf-workspace.css";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function SplitPageThumb({
  pageIndex,
  fileBytes,
  chunkIndex,
  loadingLabel,
  pageLabel,
  previewAria,
  chunkLabel,
  onPreview,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  chunkIndex: number;
  loadingLabel: string;
  pageLabel: string;
  previewAria: string;
  chunkLabel: string;
  onPreview: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageThumbnail(fileBytes, pageIndex, "", DELETE_PAGES_THUMB_SCALE).then((canvas) => {
      if (cancelled || !canvasRef.current) return;
      const node = canvasRef.current;
      node.width = canvas.width;
      node.height = canvas.height;
      const ctx = node.getContext("2d");
      if (ctx) ctx.drawImage(canvas, 0, 0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex]);

  return (
    <div
      className={[
        "visual-reorder-card visual-reorder-card--page",
        chunkIndex % 2 === 0 ? "is-chunk-even" : "is-chunk-odd",
      ].join(" ")}
      role="listitem"
    >
      <span className="visual-reorder-card__index">{pageLabel}</span>
      <span className="split-pdf-chunk-badge">{chunkLabel}</span>
      <button
        type="button"
        className="page-manage-thumb__preview-btn"
        data-pdf-page-preview=""
        aria-label={previewAria}
        onClick={onPreview}
      >
        <div className="page-manage-thumb__canvas-wrap delete-page-thumb__canvas-wrap">
          {loading ? <p className="page-manage-thumb__loading delete-page-thumb__loading">{loadingLabel}</p> : null}
          <canvas ref={canvasRef} className="page-manage-thumb__canvas delete-page-thumb__canvas" />
        </div>
      </button>
    </div>
  );
}

export function SplitPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [breaksAfter, setBreaksAfter] = useState<Set<number>>(() => new Set());
  const [rangeSpec, setRangeSpec] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const segments = useMemo(
    () => segmentsFromBreaksAfter(pageCount, breaksAfter),
    [pageCount, breaksAfter],
  );

  const pageChunkIndex = useMemo(() => {
    const map = new Map<number, number>();
    segments.forEach((segment, chunkIndex) => {
      for (let page = segment.start; page <= segment.end; page += 1) {
        map.set(page, chunkIndex);
      }
    });
    return map;
  }, [segments]);

  const syncRangeFromBreaks = useCallback((nextBreaks: Set<number>, count: number) => {
    const nextSegments = segmentsFromBreaksAfter(count, nextBreaks);
    setRangeSpec(formatSplitSegmentsSpec(nextSegments));
    setRangeError("");
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setBreaksAfter(new Set());
    setRangeSpec("");
    setRangeError("");
    setPreviewPageIndex(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf") || ws.wsCommon("choosePdf"));
        return;
      }
      const picked = list[0]!;
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setBreaksAfter(new Set());
      setRangeSpec("");
      setRangeError("");
      setDone(false);
      setRunError(null);
      setPreviewPageIndex(null);

      try {
        const { loadPdfPageCount } = await import("@/lib/pdf-delete-pages");
        const count = await loadPdfPageCount(bytes);
        setPageCount(count);
        setRangeSpec(count > 0 ? formatSplitSegmentsSpec([{ start: 0, end: count - 1 }]) : "");
        setStatus(ws.wsStatus("loaded", { count }));
      } catch {
        setPageCount(0);
        setStatus(ws.wsCommon("couldNotOpenPdf"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, tool.operation, ws],
  );

  useConsumePendingFiles(acceptPdf, (incoming) => {
    void addFile(incoming);
  });

  const toggleBreakAfter = useCallback(
    (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= pageCount - 1) return;
      setBreaksAfter((prev) => {
        const next = new Set(prev);
        if (next.has(pageIndex)) next.delete(pageIndex);
        else next.add(pageIndex);
        syncRangeFromBreaks(next, pageCount);
        return next;
      });
      setDone(false);
    },
    [pageCount, syncRangeFromBreaks],
  );

  const splitEveryPage = useCallback(() => {
    if (pageCount < 2) return;
    const next = new Set<number>();
    for (let i = 0; i < pageCount - 1; i += 1) next.add(i);
    setBreaksAfter(next);
    syncRangeFromBreaks(next, pageCount);
    setDone(false);
    setStatus(ws.wsStatus("everyPageReady", { count: pageCount }));
  }, [pageCount, syncRangeFromBreaks, ws]);

  const clearSplits = useCallback(() => {
    const next = new Set<number>();
    setBreaksAfter(next);
    syncRangeFromBreaks(next, pageCount);
    setDone(false);
    setStatus(ws.wsStatus("markersCleared"));
  }, [pageCount, syncRangeFromBreaks, ws]);

  const applyRangeSpec = useCallback(() => {
    if (!pageCount) return;
    try {
      const parsed = parseSplitPartitionSpec(rangeSpec, pageCount);
      const next = new Set(breaksAfterFromSegments(parsed));
      setBreaksAfter(next);
      setRangeSpec(formatSplitSegmentsSpec(parsed));
      setRangeError("");
      setDone(false);
      setStatus(ws.wsStatus("rangesApplied", { count: parsed.length }));
    } catch (error) {
      setRangeError(error instanceof Error ? error.message : ws.wsStatus("invalidRanges"));
    }
  }, [pageCount, rangeSpec, ws]);

  const onSplitDownload = async () => {
    if (!file || !fileBytes || busy) return;
    if (pageCount < 2) {
      setStatus(ws.wsStatus("needMultiplePages"));
      return;
    }
    if (segments.length < 2) {
      setStatus(ws.wsStatus("needSplitMarker"));
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("splitting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const parts = await pdf.splitPdfBySegments(file, segments);
      const zip = await zipBlobs(
        parts.map((entry) => ({
          name: splitPdfPartName(file.name, entry.part, entry.startPage, entry.endPage),
          blob: new Blob([entry.bytes as BlobPart], { type: "application/pdf" }),
        })),
      );
      const zipName = splitPdfZipName(file.name);
      downloadBlob(zip, zipName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: zipName, count: parts.length }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
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

  const canSplit = Boolean(file) && pageCount >= 2 && segments.length >= 2 && !busy && !rangeError;
  const splitLabel = busy
    ? ws.wsText("splittingLabel") || ws.processing
    : ws.wsText("splitDownloadLabel") || ws.buttonLabel() || "Split & Download";


  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    addFile([next]);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  return (
    <div id="tool-workspace" className="split-pdf-tool-page tool-workspace--wide space-y-3 pb-12 md:pb-8">
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
              void addFile(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            input={
              <input
                id={`${baseId}-input`}
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) void addFile(e.target.files);
                  e.target.value = "";
                }}
              />
            }
          />
        ) : null}
      </WorkspaceUploadShell>

      {file ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="truncate text-sm text-ink-muted">
              <span className="font-medium text-ink">{file.name}</span> · {pdf.formatBytes(file.size)}
              {pageCount > 0 ? (
                <span className="ms-2">{ws.wsUi("pageCountLabel", { count: pageCount })}</span>
              ) : null}
            </p>
            <button type="button" onClick={reset} disabled={busy} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>

          {fileBytes && pageCount > 0 ? (
            <div id={WORKSPACE_OPERATIONS_ID} className="visual-reorder-panel">
              <p className="visual-reorder-panel__hint">{ws.wsUi("splitHint")}</p>

              <div className="split-pdf-toolbar">
                <button
                  type="button"
                  className={toolSecondaryBtn}
                  disabled={busy || pageCount < 2}
                  onClick={splitEveryPage}
                >
                  {ws.wsUi("splitEveryPage")}
                </button>
                <button
                  type="button"
                  className={toolSecondaryBtn}
                  disabled={busy || breaksAfter.size === 0}
                  onClick={clearSplits}
                >
                  {ws.wsUi("clearSplits")}
                </button>
              </div>

              <div className="split-pdf-grid" role="list" aria-label={ws.wsUi("gridLabel")}>
                {Array.from({ length: pageCount }, (_, pageIndex) => {
                  const chunkIndex = pageChunkIndex.get(pageIndex) ?? 0;
                  return (
                    <div key={pageIndex} className="split-pdf-unit">
                      <div className="split-pdf-unit__card">
                        <SplitPageThumb
                          pageIndex={pageIndex}
                          fileBytes={fileBytes}
                          chunkIndex={chunkIndex}
                          loadingLabel={ws.wsUi("loadingThumb")}
                          pageLabel={ws.wsCommon("pageNumber", { page: pageIndex + 1 })}
                          previewAria={ws.wsCommon("openPagePreview", { page: pageIndex + 1 })}
                          chunkLabel={ws.wsUi("chunkBadge", { part: chunkIndex + 1 })}
                          onPreview={() => setPreviewPageIndex(pageIndex)}
                        />
                      </div>
                      {pageIndex < pageCount - 1 ? (
                        <button
                          type="button"
                          className={[
                            "split-pdf-gutter",
                            breaksAfter.has(pageIndex) ? "is-active" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-pressed={breaksAfter.has(pageIndex)}
                          aria-label={
                            breaksAfter.has(pageIndex)
                              ? ws.wsUi("removeSplitAfter", { page: pageIndex + 1 })
                              : ws.wsUi("addSplitAfter", { page: pageIndex + 1 })
                          }
                          title={
                            breaksAfter.has(pageIndex)
                              ? ws.wsUi("removeSplitAfter", { page: pageIndex + 1 })
                              : ws.wsUi("addSplitAfter", { page: pageIndex + 1 })
                          }
                          disabled={busy}
                          onClick={() => toggleBreakAfter(pageIndex)}
                        >
                          <span className="split-pdf-gutter__mark" aria-hidden />
                          <Scissors className="split-pdf-gutter__icon" aria-hidden strokeWidth={2} />
                          <span className="split-pdf-gutter__mark" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="split-pdf-ranges">
                <label className="split-pdf-ranges__label" htmlFor={`${baseId}-ranges`}>
                  {ws.wsUi("rangesLabel")}
                </label>
                <input
                  id={`${baseId}-ranges`}
                  type="text"
                  className="split-pdf-ranges__input"
                  value={rangeSpec}
                  disabled={busy}
                  placeholder={ws.wsUi("rangesPlaceholder")}
                  onChange={(event) => {
                    setRangeSpec(event.target.value);
                    setRangeError("");
                  }}
                  onBlur={() => applyRangeSpec()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyRangeSpec();
                    }
                  }}
                />
                <p className="split-pdf-ranges__hint">{ws.wsUi("rangesHint")}</p>
                {rangeError ? <p className="split-pdf-ranges__error">{rangeError}</p> : null}
                <p className="split-pdf-summary">
                  {ws.wsUi("segmentSummary", {
                    count: segments.length,
                    ranges: formatSplitSegmentsSpec(segments) || "—",
                  })}
                </p>
              </div>

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
                loadingLabel={ws.wsCommon("loadingPagePreview") || ws.wsUi("loadingThumb")}
                onClose={() => setPreviewPageIndex(null)}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={toolPrimaryBtn}
              disabled={!canSplit}
              onClick={() => void onSplitDownload()}
            >
              {splitLabel}
            </button>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            {ws.wsText("privacyNote") ||
              "Splitting runs locally in your browser. Your file never leaves your device."}
          </p>
        </>
      ) : null}

      <div className="tool-workspace-feedback space-y-3">
        {runError ? (
          <ToolErrorRecovery
            operation={tool.operation}
            slug={slug}
            kind={runError.kind}
            technicalMessage={runError.message}
            onDismiss={() => {
              setRunError(null);
              setStatus(ws.wsStatus("adjustFile"));
            }}
          />
        ) : status ? (
          <p className="text-sm text-neutral-700 dark:text-neutral-300" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
      </div>

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}
      <StickyMobileCta
        href="#tool-workspace"
        label={splitLabel}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
