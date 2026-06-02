"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  flattenPdfFromFile,
  flattenPdfOutputName,
  type FlattenPdfProgress,
} from "@/lib/pdf-flatten";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
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

function progressLabel(progress: FlattenPdfProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "loading") return "Loading PDF...";
  if (!progress.totalPages) return "Preparing flatten...";
  return `Flattening page ${progress.currentPage} of ${progress.totalPages}...`;
}

export function FlattenPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<FlattenPdfProgress | null>(null);
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
    setPassword("");
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

      setStatus(`${next.name} ready — flatten when you are.`);
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const onFlatten = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setProgress({ phase: "loading", currentPage: 0, totalPages: pageCount });
    setStatus("Starting flatten...");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await flattenPdfFromFile(file, {
        password: password.trim() || undefined,
        onProgress: (p) => {
          setProgress(p);
          setStatus(progressLabel(p));
        },
      });
      const outName = flattenPdfOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(`Flattened PDF downloaded as ${outName}.`);
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
      setProgress(null);
    }
  };

  const showWorkspace = Boolean(file);
  const canFlatten = Boolean(file) && !busy;
  const progressPercent =
    progress && progress.totalPages > 0
      ? Math.min(100, Math.round((progress.currentPage / progress.totalPages) * 100))
      : busy
        ? 12
        : 0;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Private:</strong> Flattening runs entirely in your browser. Your PDF never leaves your
        device.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Remove forms, comments, and annotations by flattening pages locally."
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
                {file ? pdf.formatBytes(file.size) : ""}
                {pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          <div className="protect-form__fields max-w-md">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              PDF password <span className="font-normal text-slate-500">(only if the file is protected)</span>
            </label>
            <input
              id={`${baseId}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="protect-form__input"
              placeholder="Optional"
              disabled={busy}
            />
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
              disabled={!canFlatten}
              onClick={() => void onFlatten()}
              className={toolPrimaryBtn}
            >
              {done ? "Flatten again" : "Flatten PDF"}
            </button>
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              Choose another file
            </button>
          </div>

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
            setStatus(file ? "Adjust your file or password and try again." : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label="Flatten PDF" secondaryHref="/" secondaryLabel="Home" />
    </div>
  );
}
