"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { DELETE_PAGES_THUMB_SCALE, renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { moveArrayItem, useDragReorder } from "@/hooks/useDragReorder";
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

function outputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-pages-removed.pdf`;
}

function PageThumbnail({
  pageIndex,
  displayIndex,
  fileBytes,
  marked,
  onToggle,
  dragProps,
  className,
  loadingLabel,
  pageLabel,
  undoLabel,
  restoreAria,
  markAria,
}: {
  pageIndex: number;
  displayIndex: number;
  fileBytes: Uint8Array;
  marked: boolean;
  onToggle: (pageIndex: number) => void;
  dragProps: ReturnType<ReturnType<typeof useDragReorder>["getCardProps"]>;
  className: string;
  loadingLabel: string;
  pageLabel: string;
  undoLabel: string;
  restoreAria: string;
  markAria: string;
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
    <div className={className} role="listitem" {...dragProps}>
      <span className="visual-reorder-card__index">#{displayIndex + 1}</span>
      <div className={`delete-page-thumb${marked ? " is-marked" : ""}`}>
        <div className="delete-page-thumb__canvas-wrap">
          {loading ? <p className="delete-page-thumb__loading">{loadingLabel}</p> : null}
          <canvas ref={canvasRef} className="delete-page-thumb__canvas" />
          {marked ? <div className="delete-page-thumb__strike" aria-hidden="true" /> : null}
        </div>
        <div className="delete-page-thumb__footer">
          <span className="delete-page-thumb__label">{pageLabel}</span>
          <button
            type="button"
            className="delete-page-thumb__remove"
            aria-pressed={marked}
            aria-label={marked ? restoreAria : markAria}
            onClick={() => onToggle(pageIndex)}
          >
            {marked ? (
              <span className="delete-page-thumb__remove-text">{undoLabel}</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm3 0h2v9h-2V9zM7 9h2v9H7V9z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeletePdfPagesWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const { getCardProps, cardClassName } = useDragReorder();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPageOrder([]);
    setMarked(new Set());
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      const picked = list[0];
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setMarked(new Set());
      setDone(false);
      setRunError(null);

      try {
        const { loadPdfPageCount } = await import("@/lib/pdf-delete-pages");
        const count = await loadPdfPageCount(bytes);
        setPageCount(count);
        setPageOrder(Array.from({ length: count }, (_, i) => i));
        setStatus(ws.wsStatus("loaded", { count }));
      } catch {
        setPageCount(0);
        setPageOrder([]);
        setStatus(ws.wsCommon("couldNotOpenPdf"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, tool.operation, ws],
  );

  const togglePage = useCallback((pageIndex: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
  }, []);

  const clearMarks = useCallback(() => {
    setMarked(new Set());
    setStatus(ws.wsStatus("selectionCleared"));
  }, [ws]);

  const reorder = useCallback((from: number, to: number) => {
    setPageOrder((prev) => moveArrayItem(prev, from, to));
  }, []);

  const onDelete = async () => {
    if (!file || !fileBytes || busy) return;
    const indices = [...marked];
    if (!indices.length) {
      setStatus(ws.wsStatus("markRequired"));
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("deleting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.deletePdfPagesFile(file, indices, pageOrder);
      const outName = outputName(file);
      const remaining = pageOrder.filter((i) => !marked.has(i)).length;
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName, remaining }));
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

  const markedCount = marked.size;
  const canDelete = Boolean(file) && markedCount > 0 && markedCount < pageCount && !busy;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>{ws.securePrefix}</strong> {ws.wsText("privacyNote")}
      </div>

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
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="truncate text-sm text-ink-muted">
              <span className="font-medium text-ink">{file.name}</span> · {pdf.formatBytes(file.size)}
              {markedCount > 0 ? (
                <span className="ms-2 text-amber-200">
                  {ws.wsUi("markedCount", { count: markedCount })}
                </span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>

          {fileBytes && pageCount > 0 ? (
            <div className="visual-reorder-panel">
              <p className="visual-reorder-panel__hint">{ws.wsUi("reorderHint")}</p>
              <div className="delete-pages-grid visual-reorder-grid" role="list">
                {pageOrder.map((originalIndex, displayIndex) => (
                  <PageThumbnail
                    key={originalIndex}
                    pageIndex={originalIndex}
                    displayIndex={displayIndex}
                    fileBytes={fileBytes}
                    marked={marked.has(originalIndex)}
                    onToggle={togglePage}
                    dragProps={getCardProps(displayIndex, reorder)}
                    className={cardClassName(displayIndex, "visual-reorder-card visual-reorder-card--page")}
                    loadingLabel={ws.wsUi("loadingThumb")}
                    pageLabel={ws.wsCommon("pageNumber", { page: originalIndex + 1 })}
                    undoLabel={ws.wsUi("undo")}
                    restoreAria={ws.wsUi("restorePage", { page: originalIndex + 1 })}
                    markAria={ws.wsUi("markPage", { page: originalIndex + 1 })}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="delete-pages-toolbar">
            <button
              type="button"
              disabled={busy || markedCount === 0}
              onClick={clearMarks}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5 disabled:opacity-50"
            >
              {ws.wsUi("clearSelection")}
            </button>
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => void onDelete()}
              className="btn-protect relative rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="tool-spinner" aria-hidden="true" />
                  <span>{ws.wsText("deletingLabel")}</span>
                </>
              ) : (
                ws.wsText("deleteLabel")
              )}
            </button>
          </div>
        </>
      )}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(ws.wsStatus("adjustSelection"));
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label={ws.wsText("deleteLabel")} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
