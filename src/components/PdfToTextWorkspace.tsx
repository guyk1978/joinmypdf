"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  convertPdfToText,
  formatBytes,
  pdfToTextOutputName,
  type PdfToTextProgress,
} from "@/lib/pdf-to-text";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
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

function progressLabel(progress: PdfToTextProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "loading") return "Loading PDF...";
  if (progress.phase === "building") return "Building text file...";
  return `Extracting text - page ${progress.currentPage} of ${progress.totalPages}...`;
}

export function PdfToTextWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [textBlob, setTextBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<PdfToTextProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setTextBlob(null);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus("Please choose a PDF file.");
      return;
    }
    if (next.size === 0) {
      setStatus("That file is empty. Choose another PDF.");
      return;
    }

    setFile(next);
    setTextBlob(null);
    setDone(false);
    setRunError(null);
    setStatus("Reading PDF...");

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

      setStatus(`${next.name} ready - convert to text when you are.`);
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
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setTextBlob(null);
    setProgress({ phase: "loading", currentPage: 0, totalPages: pageCount });
    setStatus("Starting conversion...");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await convertPdfToText(file, (p) => {
        setProgress(p);
        setStatus(progressLabel(p));
      });
      setTextBlob(blob);
      setDone(true);
      setStatus("Conversion complete. Download your text file below.");
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
    if (!file || !textBlob) return;
    downloadBlob(textBlob, pdfToTextOutputName(file));
    capture(EVENTS.download_click, { operation: tool.operation, slug, format: "txt" });
  };

  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const hasText = Boolean(textBlob);
  const progressPercent =
    progress && progress.totalPages > 0
      ? Math.min(
          100,
          Math.round(
            ((progress.phase === "building" ? progress.totalPages : progress.currentPage) /
              progress.totalPages) *
              100,
          ),
        )
      : busy
        ? 12
        : 0;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> PDF text extraction runs entirely in your browser. Your document
        never leaves your device.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Extract text and download a .txt file-processed locally."
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

      {showWorkspace ? (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {file ? formatBytes(file.size) : ""}
                {pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{progressLabel(progress)}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasText ? "Convert again" : "Convert to Text"}
            </button>
            {hasText ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className="rounded-xl border border-brand/40 bg-brand/10 px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/15 disabled:opacity-50"
              >
                Download text file (.txt)
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Choose another file
            </button>
          </div>

          {hasText && file ? (
            <p className="text-sm text-ink-muted">
              Ready: <span className="font-medium text-ink">{pdfToTextOutputName(file)}</span>
              {textBlob ? ` (${formatBytes(textBlob.size)})` : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              Best for PDFs with selectable text. Scanned image-only pages may need OCR in another app.
            </p>
          )}
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
            setStatus(file ? "Try converting again or choose another file." : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={hasText ? "Download .txt" : "Convert to Text"}
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}
