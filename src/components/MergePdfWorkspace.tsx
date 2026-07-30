"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceActionRow } from "@/components/WorkspaceActionRow";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useConsumePendingFiles } from "@/hooks/useConsumePendingFiles";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { useProjectResume } from "@/hooks/useProjectResume";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { moveArrayItem, useDragReorder } from "@/hooks/useDragReorder";
import { loadPdfPageCount, renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function PdfFileThumbnail({
  file,
  loadingLabel,
  previewAria,
  onPreview,
}: {
  file: File;
  loadingLabel: string;
  previewAria: string;
  onPreview: (bytes: Uint8Array, pageCount: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<{
    bytes: Uint8Array;
    pageCount: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setPreviewPayload(null);

    void (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (cancelled) return;
        const [canvas, count] = await Promise.all([
          renderPdfPageThumbnail(bytes, 0, "", 0.28),
          loadPdfPageCount(bytes).catch(() => 1),
        ]);
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        setPreviewPayload({ bytes, pageCount: Math.max(1, count) });
        setLoading(false);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <button
      type="button"
      className="visual-reorder-card__preview-btn"
      data-pdf-page-preview=""
      aria-label={previewAria}
      disabled={loading || failed || !previewPayload}
      onClick={() => {
        if (!previewPayload) return;
        onPreview(previewPayload.bytes, previewPayload.pageCount);
      }}
    >
      <div className="visual-reorder-card__thumb">
        {loading ? <p className="visual-reorder-card__loading">{loadingLabel}</p> : null}
        {failed ? (
          <div className="visual-reorder-card__pdf-icon" aria-hidden="true">
            PDF
          </div>
        ) : (
          <canvas ref={canvasRef} className="visual-reorder-card__canvas" />
        )}
      </div>
    </button>
  );
}

export function MergePdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  return (
    <Suspense fallback={null}>
      <MergePdfWorkspaceInner tool={tool} slug={slug} />
    </Suspense>
  );
}

function MergePdfWorkspaceInner({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const tProjects = useTranslations("Projects");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<{
    bytes: Uint8Array;
    pageCount: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, files.length);
  const baseId = useId();
  const { getCardProps, cardClassName } = useDragReorder();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useConsumePendingFiles(acceptPdf, (accepted) => {
    setFiles(accepted);
    capture(EVENTS.file_selected, { source: "home_pending", count: accepted.length });
  });

  const onRestoreProject = useCallback(
    (payload: { files: File[]; settings: Record<string, unknown>; projectName: string }) => {
      setFiles(payload.files);
      setDone(false);
      setRunError(null);
      setStatus(tProjects("restoredStatus", { name: payload.projectName }));
    },
    [tProjects],
  );

  useProjectResume({ toolSlug: slug, onRestore: onRestoreProject });

  const reset = useCallback(() => {
    setFiles([]);
    setStatus("");
    setDone(false);
    setRunError(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addRaw = useCallback(
    (incoming: FileList | File[]) => {
      const accepted = Array.from(incoming || []).filter(acceptPdf);
      if (!accepted.length) {
        setStatus(ws.status("noSupportedPdf"));
        return;
      }
      setFiles((prev) => [...prev, ...accepted]);
      setDone(false);
      setRunError(null);
      setStatus(ws.status("filesAdded", { count: accepted.length }));
      capture(EVENTS.file_selected, { count: accepted.length, operation: tool.operation });
    },
    [acceptPdf, tool.operation, ws],
  );

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const reorder = (from: number, to: number) => {
    setFiles((prev) => moveArrayItem(prev, from, to));
  };

  const onMerge = async () => {
    if (files.length < 2 || busy) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.status("merging"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const bytes = await pdf.mergePdfFiles(files);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "joinmypdf-merged.pdf");
      setDone(true);
      setStatus(ws.status("complete", { count: files.length }));
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

  const disabled = busy || files.length < 2;
  const mergeLabel = ws.buttonLabel();

  return (
    <div id="tool-workspace" className="tool-workspace--wide space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={files.length > 0}>
      <FileUploadZone
        operation={tool.operation}
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
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
          addRaw(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        input={
          <input
            id={`${baseId}-input`}
            ref={inputRef}
            type="file"
            className="sr-only"
            accept="application/pdf,.pdf"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) addRaw(e.target.files);
              e.target.value = "";
            }}
          />
        }
      />
      </WorkspaceUploadShell>

      {files.length > 0 ? (
        <>
          <div id={WORKSPACE_OPERATIONS_ID} className="visual-reorder-panel">
            <p className="visual-reorder-panel__hint">{ws.common("reorderHint")}</p>
            <div className="visual-reorder-grid" role="list">
              {files.map((file, idx) => {
                const dragProps = getCardProps(idx, reorder);
                const safeDragProps = {
                  ...dragProps,
                  onDragStart: (event: ReactDragEvent<HTMLElement>) => {
                    if ((event.target as Element | null)?.closest?.("[data-pdf-page-preview]")) {
                      event.preventDefault();
                      return;
                    }
                    dragProps.onDragStart(event);
                  },
                };

                return (
                  <article
                    key={`${file.name}-${file.size}-${idx}`}
                    role="listitem"
                    className={cardClassName(idx, "visual-reorder-card")}
                    {...safeDragProps}
                  >
                    <button
                      type="button"
                      className="visual-reorder-card__remove"
                      aria-label={ws.common("removeFile", { name: file.name })}
                      onClick={() => removeAt(idx)}
                    >
                      ×
                    </button>
                    <span className="visual-reorder-card__index">#{idx + 1}</span>
                    <PdfFileThumbnail
                      file={file}
                      loadingLabel={ws.common("loading")}
                      previewAria={
                        ws.wsCommon("openPagePreview", { page: 1 }) ||
                        `Open larger preview of ${file.name}`
                      }
                      onPreview={(bytes, pageCount) => setPreview({ bytes, pageCount })}
                    />
                    <p className="visual-reorder-card__name" title={file.name}>
                      {file.name}
                    </p>
                    <p className="visual-reorder-card__meta">{pdf.formatBytes(file.size)}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <PdfPagePreviewModal
            open={preview !== null}
            fileBytes={preview?.bytes ?? null}
            pageIndex={0}
            title={
              preview
                ? ws.wsCommon("pageOf", {
                    current: 1,
                    total: preview.pageCount,
                  }) || `Page 1 of ${preview.pageCount}`
                : ""
            }
            closeLabel={ws.wsCommon("closePagePreview") || "Close page preview"}
            loadingLabel={ws.wsCommon("loadingPagePreview") || ws.common("loading")}
            onClose={() => setPreview(null)}
          />

          <WorkspaceActionRow
            primaryLabel={mergeLabel}
            primaryBusyLabel={ws.common("merging")}
            busy={busy}
            disabled={disabled}
            onPrimary={() => void onMerge()}
            onClear={reset}
            clearLabel={ws.clear}
            onNewUpload={() => startNewUpload(reset)}
            newUploadLabel={ws.uploadNewFile}
            save={{
              toolSlug: slug,
              operation: tool.operation,
              files,
              settings: {},
              disabled: files.length === 0,
            }}
          />

          {runError ? (
            <ToolErrorRecovery
              operation={tool.operation}
              slug={slug}
              kind={runError.kind}
              technicalMessage={runError.message}
              onDismiss={() => {
                setRunError(null);
                setStatus(ws.status("adjustTryAgain"));
              }}
            />
          ) : (
            <p className="text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200" role="status" aria-live="polite">
              {status}
            </p>
          )}

          {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={files[0]} /> : null}

          <StickyMobileCta href="#tool-workspace" label={mergeLabel} secondaryHref="/" secondaryLabel={ws.home} />
        </>
      ) : null}
    </div>
  );
}
