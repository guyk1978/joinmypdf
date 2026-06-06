"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import {
  convertDocxToPdf,
  formatBytes,
  wordToPdfOutputName,
  type WordToPdfProgress,
} from "@/lib/word-to-pdf";
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

function progressLabel(progress: WordToPdfProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "parsing") return "Parsing Word document…";
  if (progress.phase === "rendering") return "Rendering document layout…";
  return "Building PDF…";
}

function progressPercent(progress: WordToPdfProgress | null, busy: boolean): number {
  if (!progress) return busy ? 10 : 0;
  if (progress.phase === "parsing") return 30;
  if (progress.phase === "rendering") return 65;
  return 92;
}

export function WordToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<WordToPdfProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptDocx = useCallback(
    (f: File) =>
      /\.docx$/i.test(f.name) ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    [],
  );

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPdfBlob(null);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = (next: File) => {
    if (!acceptDocx(next)) {
      setStatus("Please choose a .docx Word file.");
      return;
    }
    if (next.size === 0) {
      setStatus("That file is empty. Choose another document.");
      return;
    }
    setFile(next);
    setPdfBlob(null);
    setDone(false);
    setRunError(null);
    setStatus(`${next.name} ready — convert to PDF when you are.`);
    capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
  };

  const onConvert = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setPdfBlob(null);
    setProgress({ phase: "parsing" });
    setStatus("Starting conversion…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await convertDocxToPdf(file, (p) => {
        setProgress(p);
        setStatus(progressLabel(p));
      });
      setPdfBlob(blob);
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
    if (!file || !pdfBlob) return;
    downloadBlob(pdfBlob, wordToPdfOutputName(file));
    capture(EVENTS.download_click, { operation: tool.operation, slug, format: "pdf" });
  };

  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const hasPdf = Boolean(pdfBlob);
  const percent = progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> Word parsing and PDF generation run entirely in your browser. Your
        document never leaves your device.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a Word document here or click to browse"
          description="Convert .docx to PDF locally—no upload required."
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
            if (picked) pickFile(picked);
          }}
          onClick={() => inputRef.current?.click()}
          input={
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) pickFile(picked);
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
                {file ? formatBytes(file.size) : ""} · Microsoft Word (.docx)
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
              {hasPdf ? "Convert again" : "Convert to PDF"}
            </button>
            {hasPdf ? (
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
              Choose another file
            </button>
          </div>

          {hasPdf && file ? (
            <p className="text-sm text-ink-muted">
              Ready: <span className="font-medium text-ink">{wordToPdfOutputName(file)}</span>
              {pdfBlob ? ` (${formatBytes(pdfBlob.size)})` : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              Complex layouts, fonts, and embedded media may simplify during conversion—best for standard text
              documents.
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
        label={hasPdf ? "Download PDF" : "Convert to PDF"}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
