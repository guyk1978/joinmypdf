"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
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
import { heicProgressLabel } from "@/lib/workspace-progress-label";
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
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, files.length);
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
      setStatus(ws.wsStatus("noHeic"));
      return;
    }
    const rejected = Array.from(incoming || []).filter((file) => !isHeicFile(file));
    setFiles((prev) => [...prev, ...accepted]);
    setOutputBlob(null);
    setDone(false);
    setRunError(null);
    setStatus(
      rejected.length
        ? ws.wsStatus("filesAddedSkipped", { count: accepted.length, skipped: rejected.length })
        : ws.wsStatus("filesAdded", { count: accepted.length }),
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
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await heicToPdf(files, (p) => {
        setProgress(p);
        setStatus(heicProgressLabel(p, ws));
      });
      setOutputBlob(blob);
      setDone(true);
      setStatus(ws.wsStatus("complete"));
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

      </WorkspaceUploadShell>
      {files.length > 0 ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">
                {ws.wsUi("filesSelected", { count: files.length })}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {ws.wsUi("totalReorderHint", { size: formatBytes(totalBytes) })}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-none border border-white/10 bg-surface/40 px-3 py-2 text-sm"
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
                  {ws.wsCommon("pageNumber", { page: index + 1 })}
                </span>
                <span className="flex-1 truncate text-ink">{file.name}</span>
                <span className="text-xs text-ink-muted">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  className="rounded-none border border-white/10 px-2 py-1 text-xs text-ink-muted hover:bg-white/5"
                  onClick={() => removeAt(index)}
                  disabled={busy}
                >
                  {ws.wsCommon("remove")}
                </button>
              </li>
            ))}
          </ul>

          {busy ? (
            <WorkspaceProgressBar percent={percent} label={heicProgressLabel(progress, ws)} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className="rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-surface transition hover:bg-neutral-200 dark:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasOutput ? ws.common("convertAgain") : ws.wsText("convertLabel")}
            </button>
            {hasOutput ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-200 dark:bg-neutral-800 disabled:opacity-50"
              >
                {ws.wsText("downloadLabel")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.clear}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>

          {hasOutput ? (
            <p className="text-sm text-ink-muted">
              {ws.wsCommon("readyLabel")}{" "}
              <span className="font-medium text-ink">{heicToPdfOutputName(files)}</span>
              {outputBlob ? ` (${formatBytes(outputBlob.size)})` : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{ws.wsUi("outputHint")}</p>
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
            setStatus(files.length ? ws.wsStatus("tryAgain") : "");
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
        label={hasOutput ? ws.wsText("stickyDownloadLabel") : ws.wsText("stickyConvertLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
