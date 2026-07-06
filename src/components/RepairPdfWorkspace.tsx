"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, PdfProcessingError, type PdfProcessingError as PdfProcessingErrorType } from "@/lib/pdf-errors";
import {
  PdfRepairTooCorruptedError,
  repairPdfFromFile,
  repairPdfOutputName,
  type RepairPdfProgress,
} from "@/lib/pdf-repair";
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

function repairProgressLabel(progress: RepairPdfProgress | null, ws: ReturnType<typeof useWorkspaceI18n>): string {
  if (!progress) return "";
  const keyed = ws.wsProgress(progress.phase, {
    percent: progress.percent,
  });
  if (keyed) return keyed;
  return progress.detail || ws.wsProgress("processing") || "";
}

export function RepairPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<RepairPdfProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingErrorType | null>(null);
  const [tooCorrupt, setTooCorrupt] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
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
    setTooCorrupt(false);
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

    setFile(next);
    setDone(false);
    setRunError(null);
    setTooCorrupt(false);
    setStatus(ws.wsCommon("readingPdf"));

    try {
      const pdfjs = await import("pdfjs-dist");
      const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      const url = URL.createObjectURL(next);
      try {
        const doc = await pdfjs.getDocument({ url, password: password.trim() || undefined }).promise;
        setPageCount(doc.numPages);
        setStatus(ws.wsStatus("fileReady", { name: next.name }));
      } catch {
        setPageCount(0);
        setStatus(ws.wsStatus("fileReadyDamaged", { name: next.name }));
      } finally {
        URL.revokeObjectURL(url);
      }

      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const onRepair = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setTooCorrupt(false);
    setProgress({ phase: "scanning", percent: 0 });
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await repairPdfFromFile(file, {
        password: password.trim() || undefined,
        onProgress: (p) => {
          setProgress(p);
          setStatus(repairProgressLabel(p, ws));
        },
      });
      const outName = repairPdfOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => {
        dispatchToolComplete({ operation: tool.operation, slug });
      }, 400);
    } catch (e) {
      if (e instanceof PdfRepairTooCorruptedError) {
        setTooCorrupt(true);
        setStatus(ws.wsStatus("tooCorrupted"));
        setRunError(new PdfProcessingError("corrupt", e.userMessage, e));
      } else {
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setStatus("");
      }
      capture(EVENTS.tool_run_error, {
        operation: tool.operation,
        slug,
        message: e instanceof Error ? e.message : "repair failed",
        kind: e instanceof PdfRepairTooCorruptedError ? "corrupt" : "generic",
      });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const showWorkspace = Boolean(file);
  const canRepair = Boolean(file) && !busy;
  const percent = progress?.percent ?? (busy ? 8 : 0);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
        {!showWorkspace ? (
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
        ) : null}
      </WorkspaceUploadShell>

      {showWorkspace ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {file ? pdf.formatBytes(file.size) : ""}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : ` · ${ws.wsUi("unknownPageCount")}`}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 bg-neutral-200 px-3 py-1 text-xs font-medium text-black dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="protect-form__fields max-w-md">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              {ws.wsUi("passwordLabel")}{" "}
              <span className="font-normal text-black dark:text-neutral-200">{ws.wsUi("passwordHint")}</span>
            </label>
            <input
              id={`${baseId}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="protect-form__input"
              placeholder={ws.wsUi("passwordPlaceholder")}
              disabled={busy}
            />
          </div>

          {busy ? (
            <WorkspaceProgressBar percent={percent} label={repairProgressLabel(progress, ws)} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canRepair}
              onClick={() => void onRepair()}
              className={toolPrimaryBtn}
            >
              {done ? ws.wsText("repairAgainLabel") : ws.wsText("repairLabel")}
            </button>
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>
        </div>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={tooCorrupt ? ws.wsStatus("tooCorrupted") : runError.message}
          onDismiss={() => {
            setRunError(null);
            setTooCorrupt(false);
            setStatus(file ? ws.wsText("adjustPassword") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("repairLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
