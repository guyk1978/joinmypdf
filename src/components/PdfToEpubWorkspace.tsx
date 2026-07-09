"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  convertPdfToEbook,
  pdfToEbookOutputName,
  type EbookOutputFormat,
  type PdfToEbookProgress,
} from "@/lib/pdf-to-epub";
import { loadPdfDocument } from "@/lib/pdf-text-extract";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const OUTPUT_FORMATS: EbookOutputFormat[] = ["epub", "mobi"];

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(progress: PdfToEbookProgress | null, busy: boolean): number {
  if (!progress || progress.totalPages <= 0) {
    return busy ? 10 : 0;
  }
  const phaseWeight =
    progress.phase === "loading"
      ? 0.1
      : progress.phase === "extracting"
        ? 0.45
        : progress.phase === "rendering"
          ? 0.75
          : 1;
  const pageRatio = progress.currentPage / progress.totalPages;
  return Math.min(100, Math.round((phaseWeight * 0.25 + pageRatio * 0.75) * 100));
}

export function PdfToEpubWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: PdfToEbookProgress | null) => progressLabelFromPhase(tool.operation, p, ws);
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<EbookOutputFormat>("epub");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<PdfToEbookProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }
    setDone(false);
    setRunError(null);
    setFile(next);
    setStatus(ws.wsCommon("readingFile"));
    try {
      const doc = await loadPdfDocument(next);
      setPageCount(doc.numPages);
      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const runConvert = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, format });

    try {
      const blob = await convertPdfToEbook(file, { format }, setProgress);
      const outName = pdfToEbookOutputName(file, format);
      downloadBlob(blob, outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, format });
      capture(EVENTS.download_click, { operation: tool.operation, slug, format });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
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

  const canConvert = Boolean(file && !busy);
  const percent = progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
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
      </WorkspaceUploadShell>

      {file ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {pdf.formatBytes(file.size)}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : ""}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{status}</p>
            </div>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>

          <fieldset className="space-y-2 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {ws.wsUi("formatLegend")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_FORMATS.map((value) => (
                <label
                  key={value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-neutral-800 bg-black px-3 py-2 text-sm text-neutral-200"
                >
                  <input
                    type="radio"
                    name={`${baseId}-format`}
                    value={value}
                    checked={format === value}
                    disabled={busy}
                    onChange={() => setFormat(value)}
                    className="accent-white"
                  />
                  <span>{ws.wsUi(`format_${value}`)}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-muted">{ws.wsUi("formatHint")}</p>
          </fieldset>

          <button type="button" className={toolPrimaryBtn} disabled={!canConvert} onClick={() => void runConvert()}>
            {busy ? ws.wsText("convertingLabel") : ws.wsText("convertLabel")}
          </button>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          {runError ? (
            <ToolErrorRecovery
              operation={tool.operation}
              slug={slug}
              kind={runError.kind}
              technicalMessage={runError.message}
              onDismiss={() => setRunError(null)}
            />
          ) : null}

          {done ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className={toolSecondaryBtn} disabled={busy} onClick={() => void runConvert()}>
                {ws.wsText("convertAgainLabel")}
              </button>
            </div>
          ) : null}

          <p className="text-xs text-ink-muted">{ws.wsText("privacyNote")}</p>
        </div>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("convertLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
