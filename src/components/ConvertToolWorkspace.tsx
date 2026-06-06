"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import type { ToolDefinition } from "@/lib/types";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { formatBytes } from "@/lib/pdf-to-word";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
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

export type ConvertToolWorkspaceConfig<TProgress> = {
  accept: (file: File) => boolean;
  acceptAttr: string;
  /** Fallback when Workspaces keys are missing */
  dropTitle?: string;
  dropDescription?: string;
  invalidTypeMessage?: string;
  emptyFileMessage?: string;
  privacyNote?: string;
  fileTypeLabel?: string;
  convertLabel?: string;
  downloadLabel?: string;
  outputHint?: string;
  stickyDownloadLabel?: string;
  stickyConvertLabel?: string;
  /** Optional override; defaults to Workspaces progress keys by phase */
  progressLabel?: (progress: TProgress | null) => string;
  progressPercent: (progress: TProgress | null, busy: boolean) => number;
  readMeta?: (file: File) => Promise<string>;
  convert: (file: File, onProgress: (p: TProgress) => void) => Promise<Blob>;
  outputName: (file: File) => string;
};

type ConvertToolWorkspaceProps<TProgress> = {
  tool: ToolDefinition;
  slug: string;
  config: ConvertToolWorkspaceConfig<TProgress>;
};

export function ConvertToolWorkspace<TProgress>({
  tool,
  slug,
  config,
}: ConvertToolWorkspaceProps<TProgress>) {
  const ws = useWorkspaceI18n(tool.operation);

  const invalidTypeMessage =
    config.invalidTypeMessage ?? ws.wsStatus("invalidType") ?? ws.wsCommon("choosePdf");
  const emptyFileMessage =
    config.emptyFileMessage ?? ws.wsStatus("emptyFile") ?? ws.wsCommon("emptyPdf");
  const privacyNote = config.privacyNote ?? ws.wsText("privacyNote");
  const fileTypeLabel = config.fileTypeLabel ?? ws.wsText("fileTypeLabel") ?? "PDF";
  const convertLabel = config.convertLabel ?? ws.wsText("convertLabel") ?? ws.buttonLabel();
  const downloadLabel = config.downloadLabel ?? ws.wsText("downloadLabel") ?? ws.common("ready");
  const outputHint = config.outputHint ?? ws.wsText("outputHint");
  const stickyDownloadLabel =
    config.stickyDownloadLabel ?? ws.wsText("stickyDownloadLabel") ?? downloadLabel;
  const stickyConvertLabel =
    config.stickyConvertLabel ?? ws.wsText("stickyConvertLabel") ?? convertLabel;

  const labelProgress = (p: TProgress | null) => {
    if (config.progressLabel) return config.progressLabel(p);
    return progressLabelFromPhase(tool.operation, p, ws);
  };

  const [file, setFile] = useState<File | null>(null);
  const [metaLine, setMetaLine] = useState("");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<TProgress | null>(null);
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
    setFile(null);
    setMetaLine("");
    setOutputBlob(null);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!config.accept(next)) {
      setStatus(invalidTypeMessage);
      return;
    }
    if (next.size === 0) {
      setStatus(emptyFileMessage);
      return;
    }
    setFile(next);
    setOutputBlob(null);
    setDone(false);
    setRunError(null);
    setStatus(ws.common("readingFile"));
    try {
      const meta = config.readMeta ? await config.readMeta(next) : "";
      setMetaLine(meta);
      const fileReady =
        ws.wsStatus("fileReady", { name: next.name }) ||
        ws.wsCommon("fileReadyAction", { name: next.name, action: convertLabel.toLowerCase() });
      setStatus(fileReady);
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setMetaLine("");
    }
  };

  const onConvert = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setOutputBlob(null);
    setStatus(ws.common("startingConversion"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await config.convert(file, (p) => {
        setProgress(p);
        setStatus(labelProgress(p));
      });
      setOutputBlob(blob);
      setDone(true);
      setStatus(ws.common("conversionComplete"));
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
    if (!file || !outputBlob) return;
    downloadBlob(outputBlob, config.outputName(file));
    capture(EVENTS.download_click, { operation: tool.operation, slug });
  };

  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const hasOutput = Boolean(outputBlob);
  const percent = config.progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>{ws.securePrefix}</strong> {privacyNote}
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          operation={tool.operation}
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title={ws.uploadTitle(config.dropTitle)}
          description={ws.uploadDescription(config.dropDescription)}
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
              accept={config.acceptAttr}
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
                {metaLine ? ` · ${metaLine}` : ""} · {fileTypeLabel}
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {ws.clientSideOnly}
            </span>
          </div>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasOutput ? ws.common("convertAgain") : convertLabel}
            </button>
            {hasOutput ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className="rounded-xl border border-brand/40 bg-brand/10 px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/15 disabled:opacity-50"
              >
                {downloadLabel}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>

          {hasOutput && file ? (
            <p className="text-sm text-ink-muted">
              {ws.common("ready")}{" "}
              <span className="font-medium text-ink">{config.outputName(file)}</span>
              {outputBlob ? ` (${formatBytes(outputBlob.size)})` : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{outputHint}</p>
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
            setStatus(file ? ws.status("tryAgainOrChoose") : "");
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
        label={hasOutput ? stickyDownloadLabel : stickyConvertLabel}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
