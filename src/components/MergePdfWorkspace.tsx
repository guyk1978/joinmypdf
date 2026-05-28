"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { usePendingFiles } from "@/context/PendingFilesContext";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { moveArrayItem, useDragReorder } from "@/hooks/useDragReorder";
import { renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
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

function PdfFileThumbnail({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const canvas = await renderPdfPageThumbnail(bytes, 0, "", 0.28);
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
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
    <div className="visual-reorder-card__thumb">
      {loading ? <p className="visual-reorder-card__loading">Loading…</p> : null}
      {failed ? (
        <div className="visual-reorder-card__pdf-icon" aria-hidden="true">
          PDF
        </div>
      ) : (
        <canvas ref={canvasRef} className="visual-reorder-card__canvas" />
      )}
    </div>
  );
}

export function MergePdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const { consumePendingFiles } = usePendingFiles();
  const [files, setFiles] = useState<File[]>([]);
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

  useEffect(() => {
    const pending = consumePendingFiles();
    if (!pending?.length) return;
    const accepted = pending.filter(acceptPdf);
    if (accepted.length) {
      setFiles(accepted);
      capture(EVENTS.file_selected, { source: "home_pending", count: accepted.length });
    }
  }, [consumePendingFiles, acceptPdf]);

  const reset = useCallback(() => {
    setFiles([]);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addRaw = useCallback(
    (incoming: FileList | File[]) => {
      const accepted = Array.from(incoming || []).filter(acceptPdf);
      if (!accepted.length) {
        setStatus("No supported PDF files detected.");
        return;
      }
      setFiles((prev) => [...prev, ...accepted]);
      setDone(false);
      setRunError(null);
      setStatus(`${accepted.length} file(s) added. Drag cards to set merge order.`);
      capture(EVENTS.file_selected, { count: accepted.length, operation: tool.operation });
    },
    [acceptPdf, tool.operation],
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
    setStatus("Merging PDFs…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const bytes = await pdf.mergePdfFiles(files);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "joinmypdf-merged.pdf");
      setDone(true);
      setStatus(`Merged ${files.length} file(s) in your chosen order.`);
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

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop PDFs here or click to browse"
        description="Select two or more PDFs. Drag thumbnails to reorder before merging."
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

      {files.length > 0 ? (
        <div className="visual-reorder-panel">
          <p className="visual-reorder-panel__hint">
            Drag cards to reorder. Files merge left-to-right, top-to-bottom.
          </p>
          <div className="visual-reorder-grid" role="list">
            {files.map((file, idx) => (
              <article
                key={`${file.name}-${file.size}-${idx}`}
                role="listitem"
                className={cardClassName(idx, "visual-reorder-card")}
                {...getCardProps(idx, reorder)}
              >
                <button
                  type="button"
                  className="visual-reorder-card__remove"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeAt(idx)}
                >
                  ×
                </button>
                <span className="visual-reorder-card__index">#{idx + 1}</span>
                <PdfFileThumbnail file={file} />
                <p className="visual-reorder-card__name" title={file.name}>
                  {file.name}
                </p>
                <p className="visual-reorder-card__meta">{pdf.formatBytes(file.size)}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onMerge()}
          className={toolPrimaryBtn}
        >
          {busy ? "Merging…" : "Merge PDFs"}
        </button>
        <button
          type="button"
          onClick={reset}
          className={toolSecondaryBtn}
        >
          Clear
        </button>
      </div>

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus("Adjust your file list and try again.");
          }}
        />
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label="Merge PDFs" secondaryHref="/" secondaryLabel="Home" />
    </div>
  );
}
