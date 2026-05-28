"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  convertOpenofficeToPdfBytes,
  detectOpenofficeFormat,
  formatBytes,
  openofficeFormatLabel,
  openofficeToPdfOutputName,
  readOpenofficeMeta,
  type OpenofficeProgressPhase,
} from "@/lib/openoffice-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
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

function progressLabel(phase: OpenofficeProgressPhase | null): string {
  if (!phase) return "";
  if (phase === "extracting") return "Unpacking OpenDocument archive…";
  if (phase === "parsing") return "Parsing content.xml…";
  if (phase === "layout") return "Building PDF layout…";
  return "Finalizing download…";
}

export function OpenofficeToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [formatLabel, setFormatLabel] = useState("");
  const [phase, setPhase] = useState<OpenofficeProgressPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptOdf = useCallback((f: File) => Boolean(detectOpenofficeFormat(f)), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFormatLabel("");
    setPhase(null);
    setProgress(0);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (picked: File) => {
    if (!acceptOdf(picked)) {
      setStatus("Please choose a .odt, .ods, or .odp OpenOffice file.");
      return;
    }
    if (picked.size === 0) {
      setStatus("That file is empty. Choose another document.");
      return;
    }
    setFile(picked);
    setDone(false);
    setRunError(null);
    setPhase(null);
    setProgress(0);
    setStatus("Reading OpenDocument structure…");
    try {
      const meta = await readOpenofficeMeta(picked);
      setFormatLabel(meta.label);
      setStatus(
        `${picked.name} ready (${meta.label}, ${formatBytes(picked.size)}) — convert when you are set.`,
      );
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setFormatLabel("");
    }
  };

  const onConvert = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("extracting");
    setProgress(10);
    setStatus("Extracting content…");

    try {
      const bytes = await convertOpenofficeToPdfBytes(file, (p, pct) => {
        setPhase(p);
        setProgress(pct);
        setStatus(progressLabel(p));
      });

      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        openofficeToPdfOutputName(file),
      );
      setDone(true);
      setStatus("Conversion complete. Your download should start automatically.");
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setPhase(null);
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

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> OpenOffice conversion unpacks and compiles your file entirely in your browser.
        Nothing is uploaded to our servers.
      </div>

      {!file ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop an OpenOffice file here"
          description="Supports .odt documents, .ods spreadsheets, and .odp presentations."
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
              accept=".odt,.ods,.odp,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.presentation"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = "";
              }}
            />
          }
        />
      ) : (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatLabel || (detectOpenofficeFormat(file) ? openofficeFormatLabel(detectOpenofficeFormat(file)!) : "")}
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          {busy && (
            <div className="space-y-3" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{progressLabel(phase)}</span>
                <span>{Math.min(100, Math.max(5, progress))}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
                  style={{ width: `${Math.max(8, progress)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onConvert()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              Convert to PDF
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Choose another file
            </button>
          </div>
        </div>
      )}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? "Try again or choose another file." : "");
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
        label={file ? "Convert to PDF" : "OpenOffice to PDF"}
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}