"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  isWebpFile,
  webpToJpg,
  webpToJpgDownloadName,
  webpToJpgZip,
  type WebpToJpgOutput,
  type WebpToJpgProgress,
} from "@/lib/webp-to-jpg";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { formatBytes } from "@/lib/pdf-to-word";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { heicProgressLabel } from "@/lib/workspace-progress-label";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(progress: WebpToJpgProgress | null, busy: boolean): number {
  if (!progress) return busy ? 8 : 0;
  if (progress.phase === "packaging") return 95;
  if (!progress.totalFiles) return 20;
  return Math.min(90, Math.round((progress.currentFile / progress.totalFiles) * 90));
}

export function WebpToJpgWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const t = useTranslations("WebpToJpg");
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<WebpToJpgOutput[]>([]);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<WebpToJpgProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, files.length);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFiles([]);
    setOutputs([]);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming || []).filter(isWebpFile);
    if (!accepted.length) {
      setStatus(ws.wsStatus("noWebp"));
      return;
    }
    const rejected = Array.from(incoming || []).filter((file) => !isWebpFile(file));
    setFiles((prev) => [...prev, ...accepted]);
    setOutputs([]);
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
    setOutputs([]);
    setDone(false);
  };

  const onConvert = async () => {
    if (!files.length) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setOutputs([]);
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const converted = await webpToJpg(files, (p) => {
        setProgress(p);
        setStatus(heicProgressLabel(p, ws));
      });
      setOutputs(converted);
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

  const onDownload = async () => {
    if (!outputs.length) return;
    capture(EVENTS.download_click, { operation: tool.operation, slug });

    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].fileName);
      return;
    }

    setBusy(true);
    setProgress({ phase: "packaging", currentFile: outputs.length, totalFiles: outputs.length });
    setStatus(ws.wsStatus("packaging"));
    try {
      const zip = await webpToJpgZip(outputs);
      downloadBlob(zip, webpToJpgDownloadName(outputs));
    } finally {
      setBusy(false);
      setProgress(null);
      setStatus(ws.wsStatus("complete"));
    }
  };

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const canConvert = files.length > 0 && !busy;
  const hasOutput = outputs.length > 0;
  const percent = progressPercent(progress, busy);
  const downloadLabel =
    outputs.length > 1 ? ws.wsText("downloadZipLabel") : ws.wsText("downloadLabel");

  const ACCEPT = "image/webp,.webp";

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={files.length > 0}>
        <ImageToolDropzone
          dropTitle={t("dropTitle")}
          selectLabel={t("selectFile")}
          selectAria={t("selectFileAria")}
          dropHint={t("dropHint")}
          supportedFormats={["WEBP"]}
          accept={ACCEPT}
          multiple
          disabled={busy}
          onFiles={addFiles}
        />
        <input
          id={`${baseId}-input`}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ACCEPT}
          multiple
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
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
                {ws.wsUi("totalHint", { size: formatBytes(totalBytes) })}
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
              >
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
                onClick={() => void onDownload()}
                className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-200 dark:bg-neutral-800 disabled:opacity-50"
              >
                {downloadLabel}
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
              <span className="font-medium text-ink">{webpToJpgDownloadName(outputs)}</span>
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

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={files[0]} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={hasOutput ? ws.wsText("stickyDownloadLabel") : ws.wsText("stickyConvertLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
