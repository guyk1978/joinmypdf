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
  extractTablesFromPdf,
  extractTablesPdfOutputName,
  type ExtractTablesPdfProgress,
  type TableOutputFormat,
} from "@/lib/extract-tables-pdf";
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

const OUTPUT_FORMATS: TableOutputFormat[] = ["csv", "xlsx"];

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(progress: ExtractTablesPdfProgress | null, busy: boolean): number {
  if (!progress || progress.totalPages <= 0) {
    return busy ? 10 : 0;
  }
  if (progress.phase === "loading") return 12;
  if (progress.phase === "building") return 95;
  return Math.min(90, Math.round((progress.currentPage / progress.totalPages) * 90));
}

export function ExtractTablesPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: ExtractTablesPdfProgress | null) => {
    if (!p) return "";
    if (p.phase === "parsing" && typeof p.tablesFound === "number" && p.tablesFound > 0) {
      return ws.wsProgress("parsingWithTables", {
        current: p.currentPage,
        total: p.totalPages,
        count: p.tablesFound,
      });
    }
    return progressLabelFromPhase(tool.operation, p, ws);
  };
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<TableOutputFormat>("xlsx");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<ExtractTablesPdfProgress | null>(null);
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

  const runExtract = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, format });

    let tableCount = 0;
    try {
      const blob = await extractTablesFromPdf(file, format, (p) => {
        if (typeof p.tablesFound === "number") tableCount = p.tablesFound;
        setProgress(p);
      });
      const multipleTables = format === "csv" && blob.type.includes("zip");
      const outName = extractTablesPdfOutputName(file, format, multipleTables);
      downloadBlob(blob, outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName, count: tableCount || 1 }));
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

  const canExtract = Boolean(file && !busy);
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

          <fieldset className="protect-form__fields max-w-md space-y-2">
            <legend className="protect-form__label">{ws.wsUi("formatLegend")}</legend>
            <div className="flex flex-wrap gap-4">
              {OUTPUT_FORMATS.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name={`${baseId}-format`}
                    value={value}
                    checked={format === value}
                    disabled={busy}
                    onChange={() => setFormat(value)}
                  />
                  {ws.wsUi(`format_${value}`)}
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-muted">{ws.wsUi("formatHint")}</p>
          </fieldset>

          <button type="button" className={toolPrimaryBtn} disabled={!canExtract} onClick={() => void runExtract()}>
            {busy ? ws.wsText("extractingLabel") : ws.wsText("extractLabel")}
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
              <button type="button" className={toolSecondaryBtn} disabled={busy} onClick={() => void runExtract()}>
                {ws.wsText("extractAgainLabel")}
              </button>
            </div>
          ) : null}

          <p className="text-xs text-ink-muted">{ws.wsText("privacyNote")}</p>
        </div>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("extractLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
