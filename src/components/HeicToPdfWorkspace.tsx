"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  heicToPdf,
  heicToPdfOutputName,
  isHeicFile,
  type HeicToPdfProgress,
} from "@/lib/heic-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { formatBytes } from "@/lib/pdf-to-word";
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

function progressLabel(progress: HeicToPdfProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "converting") {
    if (progress.fileName) {
      return `Decoding ${progress.fileName} (${progress.currentFile} of ${progress.totalFiles})…`;
    }
    return "Preparing HEIC images…";
  }
  if (progress.currentPage && progress.totalPages) {
    return `Building PDF — page ${progress.currentPage} of ${progress.totalPages}…`;
  }
  return "Building PDF…";
}

function progressPercent(progress: HeicToPdfProgress | null, busy: boolean): number {
  if (!progress) return busy ? 8 : 0;
  if (progress.phase === "converting") {
    if (!progress.totalFiles) return 20;
    return Math.min(55, Math.round((progress.currentFile / progress.totalFiles) * 55));
  }
  if (progress.currentPage && progress.totalPages) {
    return 55 + Math.round((progress.currentPage / progress.totalPages) * 40);
  }
  return 75;
}

export function HeicToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [files, setFiles] = useState<File[]>([]);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<HeicToPdfProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFiles([]);
    setOutputBlob(null);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming || []).filter(isHeicFile);
    if (!accepted.length) {
      setStatus("No HEIC/HEIF files detected. Choose .heic or .heif images.");
      return;
    }
    const rejected = Array.from(incoming || []).filter((file) => !isHeicFile(file));
    setFiles((prev) => [...prev, ...accepted]);
    setOutputBlob(null);
    setDone(false);
    setRunError(null);
    setStatus(
      rejected.length
        ? `${accepted.length} HEIC file(s) added. Skipped ${rejected.length} unsupported file(s).`
        : `${accepted.length} HEIC file(s) added. Reorder if needed, then convert.`,
    );
    capture(EVENTS.file_selected, { operation: tool.operation, count: accepted.length });
  };

  const removeAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setOutputBlob(null);
    setDone(false);
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setFiles((prev) => {
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setOutputBlob(null);
    setDone(false);
  };

  const onConvert = async () => {
    if (!files.length) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setOutputBlob(null);
    setStatus("Starting conversion…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await heicToPdf(files, (p) => {
        setProgress(p);
        setStatus(progressLabel(p));
      });
      setOutputBlob(blob);
      setDone(true);
      setStatus("Conversion complete. Download your PDF below.");
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
    if (!outputBlob || !files.length) return;
    downloadBlob(outputBlob, heicToPdfOutputName(files));
    capture(EVENTS.download_click, { operation: tool.operation, slug });
  };

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const canConvert = files.length > 0 && !busy;
  const hasOutput = Boolean(outputBlob);
  const percent = progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> HEIC decoding and PDF generation run entirely in your browser.
        Your photos never leave your device.
      </div>

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop HEIC photos here or click to browse"
        description="Add one or more .heic / .heif files. Reorder before converting to a multi-page PDF."
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
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        input={
          <input
            id={`${baseId}-input`}
            ref={inputRef}
            type="file"
            className="sr-only"
            accept="image/heic,image/heif,.heic,.heif"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        }
      />

      {files.length > 0 ? (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">
                {files.length} HEIC file{files.length === 1 ? "" : "s"} selected
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatBytes(totalBytes)} total · drag rows to reorder pages
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-surface/40 px-3 py-2 text-sm"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData("text/plain"));
                  if (!Number.isNaN(from)) move(from, index);
                }}
              >
                <span className="min-w-[4.5rem] text-xs font-medium text-ink-muted">
                  Page {index + 1}
                </span>
                <span className="flex-1 truncate text-ink">{file.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-ink-muted hover:bg-white/5"
                  onClick={() => removeAt(index)}
                  disabled={busy}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{progressLabel(progress)}</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
                  style={{ width: `${percent}%` }}
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
              {hasOutput ? "Convert again" : "Convert to PDF"}
            </button>
            {hasOutput ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className="rounded-xl border border-brand/40 bg-brand/10 px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/15 disabled:opacity-50"
              >
                Download PDF
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          {hasOutput ? (
            <p className="text-sm text-ink-muted">
              Ready:{" "}
              <span className="font-medium text-ink">{heicToPdfOutputName(files)}</span>
              {outputBlob ? ` (${formatBytes(outputBlob.size)})` : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              Each HEIC becomes one PDF page at full image resolution. Live Photo bursts may add
              multiple pages from a single file.
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
            setStatus(files.length ? "Try converting again or adjust your file list." : "");
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
        label={hasOutput ? "Download PDF" : "Convert to PDF"}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
