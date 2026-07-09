"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import {
  clampOptimizerQuality,
  detectImageFormatLabel,
  imageOptimizerDownloadName,
  imageOptimizerZip,
  isAcceptedImageFile,
  optimizeImageFile,
  type OptimizerOutputFormat,
  type OptimizeImageResult,
} from "@/lib/image-optimizer";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { formatBytes } from "@/lib/pdf-to-word";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

const OUTPUT_FORMATS: OptimizerOutputFormat[] = ["webp", "jpg", "png"];

type QueueStatus = "pending" | "processing" | "done" | "error";

type QueueItem = {
  id: string;
  file: File;
  thumbnailUrl: string;
  formatLabel: string;
  status: QueueStatus;
  progress: number;
  result?: OptimizeImageResult;
  error?: string;
};

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function makeQueueItem(file: File): QueueItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    file,
    thumbnailUrl: URL.createObjectURL(file),
    formatLabel: detectImageFormatLabel(file),
    status: "pending",
    progress: 0,
  };
}

export function ImageOptimizerWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const t = useTranslations("ImageOptimizer");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<OptimizerOutputFormat>("webp");
  const [quality, setQuality] = useState(85);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<QueueItem[]>([]);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, items.length);
  const baseId = useId();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    };
  }, []);

  const revokeItems = useCallback((list: QueueItem[]) => {
    for (const item of list) {
      URL.revokeObjectURL(item.thumbnailUrl);
    }
  }, []);

  const reset = useCallback(() => {
    revokeItems(items);
    setItems([]);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [items, revokeItems]);

  const addFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming || []).filter(isAcceptedImageFile);
    if (!accepted.length) {
      setStatus(ws.wsStatus("noImages"));
      return;
    }
    setItems((prev) => [...prev, ...accepted.map(makeQueueItem)]);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("filesAdded", { count: accepted.length }));
    capture(EVENTS.file_selected, { operation: tool.operation, count: accepted.length });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.thumbnailUrl);
      return prev.filter((item) => item.id !== id);
    });
    setDone(false);
  };

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const processOne = async (item: QueueItem): Promise<OptimizeImageResult> => {
    updateItem(item.id, { status: "processing", progress: 0, error: undefined, result: undefined });

    const result = await optimizeImageFile(item.file, {
      format: outputFormat,
      qualityPercent: quality,
      stripMetadata,
      onProgress: (percent) => updateItem(item.id, { progress: percent }),
    });

    updateItem(item.id, { status: "done", progress: 100, result });
    return result;
  };

  const onOptimizeOne = async (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item || busy) return;

    setBusy(true);
    setRunError(null);
    setStatus(ws.wsStatus("processingOne", { name: item.file.name }));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, mode: "single" });

    try {
      await processOne(item);
      setDone(true);
      setStatus(ws.wsStatus("oneComplete"));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, mode: "single" });
    } catch (e) {
      const parsed = classifyPdfError(e);
      updateItem(id, { status: "error", error: parsed.message });
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
    }
  };

  const onOptimizeAll = async () => {
    if (!items.length || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, mode: "batch" });

    const results: OptimizeImageResult[] = [];

    try {
      for (const item of items) {
        if (item.status === "done" && item.result) {
          results.push(item.result);
          continue;
        }
        setStatus(ws.wsStatus("processingBatch", { name: item.file.name }));
        const result = await processOne(item);
        results.push(result);
      }

      setDone(true);
      setStatus(ws.wsStatus("batchComplete", { count: results.length }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, mode: "batch" });
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
    }
  };

  const onDownloadAll = async () => {
    const outputs = items.filter((item) => item.result).map((item) => item.result!);
    if (!outputs.length) return;

    capture(EVENTS.download_click, { operation: tool.operation, slug });

    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].fileName);
      return;
    }

    setPackaging(true);
    setStatus(ws.wsStatus("packaging"));
    try {
      const zip = await imageOptimizerZip(outputs);
      downloadBlob(zip, imageOptimizerDownloadName(outputs));
    } finally {
      setPackaging(false);
      setStatus(ws.wsStatus("batchComplete", { count: outputs.length }));
    }
  };

  const completed = items.filter((item) => item.status === "done" && item.result);
  const hasOutputs = completed.length > 0;
  const canOptimize = items.length > 0 && !busy && !packaging;
  const totalOriginalBytes = items.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
        <ImageToolDropzone
          dropTitle={t("dropTitle")}
          selectLabel={t("selectFile")}
          selectAria={t("selectFileAria")}
          dropHint={t("dropHint")}
          supportedFormats={["JPG", "PNG", "WEBP", "HEIC", "GIF"]}
          accept={ACCEPT}
          multiple
          disabled={busy || packaging}
          onFiles={addFiles}
        />
        <input
          id={`${baseId}-input`}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ACCEPT}
          multiple
          disabled={busy || packaging}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </WorkspaceUploadShell>

      {items.length > 0 ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">
                {ws.wsUi("filesSelected", { count: items.length })}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {ws.wsUi("totalHint", { size: formatBytes(totalOriginalBytes) })}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="grid gap-4 rounded-none border border-white/10 bg-surface/30 p-4 md:grid-cols-3">
            <div>
              <label className="protect-form__label" htmlFor={`${baseId}-format`}>
                {t("convertAllLabel")}
              </label>
              <select
                id={`${baseId}-format`}
                value={outputFormat}
                disabled={busy || packaging}
                onChange={(e) => {
                  setOutputFormat(e.target.value as OptimizerOutputFormat);
                  setDone(false);
                }}
                className="protect-form__input mt-1"
              >
                {OUTPUT_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {t(`formats.${format}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="protect-form__label" htmlFor={`${baseId}-quality`}>
                {t("qualityLabel", { percent: quality })}
              </label>
              <input
                id={`${baseId}-quality`}
                type="range"
                min={1}
                max={100}
                value={quality}
                disabled={busy || packaging || outputFormat === "png"}
                onChange={(e) => {
                  setQuality(clampOptimizerQuality(Number(e.target.value)));
                  setDone(false);
                }}
                className="mt-2 w-full accent-neutral-400"
              />
              {outputFormat === "png" ? (
                <p className="mt-1 text-xs text-ink-muted">{t("pngQualityHint")}</p>
              ) : null}
            </div>

            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={stripMetadata}
                  disabled={busy || packaging}
                  onChange={(e) => {
                    setStripMetadata(e.target.checked);
                    setDone(false);
                  }}
                  className="h-4 w-4 rounded-none border border-white/20"
                />
                {t("stripMetadataLabel")}
              </label>
            </div>
          </div>

          <div className="overflow-x-auto rounded-none border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-surface/50 text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">{t("table.thumbnail")}</th>
                  <th className="px-3 py-2 font-semibold">{t("table.originalSize")}</th>
                  <th className="px-3 py-2 font-semibold">{t("table.format")}</th>
                  <th className="px-3 py-2 font-semibold">{t("table.progress")}</th>
                  <th className="px-3 py-2 font-semibold">{t("table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="h-14 w-14 rounded-none border border-white/10 object-cover"
                        />
                        <span className="max-w-[10rem] truncate text-ink">{item.file.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{formatBytes(item.file.size)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-none border border-white/10 px-2 py-0.5 text-xs font-medium text-ink">
                        {item.formatLabel}
                      </span>
                    </td>
                    <td className="min-w-[10rem] px-3 py-3">
                      {item.status === "processing" ? (
                        <WorkspaceProgressBar
                          percent={item.progress}
                          label={t("processingPercent", { percent: item.progress })}
                        />
                      ) : item.status === "done" && item.result ? (
                        <div className="space-y-1 text-xs">
                          <p className="text-ink">{formatBytes(item.result.outputBytes)}</p>
                          {item.result.savingsPercent > 0 ? (
                            <p className="font-medium text-emerald-400">
                              {t("savedPercent", { percent: item.result.savingsPercent })}
                            </p>
                          ) : (
                            <p className="text-ink-muted">{t("noSavings")}</p>
                          )}
                        </div>
                      ) : item.status === "error" ? (
                        <p className="text-xs text-red-400">{item.error}</p>
                      ) : (
                        <p className="text-xs text-ink-muted">{t("pending")}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy || packaging || item.status === "processing"}
                          onClick={() => void onOptimizeOne(item.id)}
                          className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50"
                        >
                          {item.status === "done" ? t("optimizeAgain") : t("optimize")}
                        </button>
                        {item.result ? (
                          <button
                            type="button"
                            disabled={packaging}
                            onClick={() => downloadBlob(item.result!.blob, item.result!.fileName)}
                            className="rounded-none border border-white/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
                          >
                            {t("download")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy || packaging}
                          onClick={() => removeItem(item.id)}
                          className="rounded-none border border-white/10 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-white/5 disabled:opacity-50"
                        >
                          {ws.wsCommon("remove")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canOptimize}
              onClick={() => void onOptimizeAll()}
              className="rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-surface transition hover:bg-neutral-200 dark:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasOutputs ? t("optimizeAllAgain") : t("optimizeAll")}
            </button>
            {hasOutputs ? (
              <button
                type="button"
                disabled={packaging}
                onClick={() => void onDownloadAll()}
                className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-black dark:text-neutral-200 transition hover:bg-neutral-200 dark:bg-neutral-800 disabled:opacity-50"
              >
                {completed.length > 1 ? ws.wsText("downloadZipLabel") : ws.wsText("downloadLabel")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy || packaging}
              onClick={reset}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.clear}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy || packaging}
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
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(items.length ? ws.wsStatus("tryAgain") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={items[0]?.file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={hasOutputs ? ws.wsText("stickyDownloadLabel") : ws.wsText("stickyConvertLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
