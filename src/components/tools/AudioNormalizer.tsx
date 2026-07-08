"use client";

import { clsx } from "clsx";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
  Volume2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { LOUDNORM_FILTER } from "@/components/tools/ffmpeg/normalize-audio";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegAudioNormalize,
  type FfmpegAudioNormalizeBatchResult,
} from "@/components/tools/hooks/useFfmpegAudioNormalize";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";

type BatchItem = {
  id: string;
  file: File;
};

function createBatchItem(file: File): BatchItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${file.name}-${Date.now()}-${Math.random()}`,
    file,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function validateMp3Batch(files: File[]): string | null {
  const invalid = files.find((file) => !isMp3File(file));
  if (invalid) {
    return `Invalid file "${invalid.name}". Please upload valid MP3 files only.`;
  }
  return null;
}

function itemStatus(
  item: BatchItem,
  result: FfmpegAudioNormalizeBatchResult | null,
  busy: boolean,
  processingName: string | null,
): "pending" | "processing" | "done" | "error" {
  if (!result) {
    if (busy && processingName === item.file.name) return "processing";
    return "pending";
  }

  if (result.successes.some((success) => success.sourceName === item.file.name)) {
    return "done";
  }
  if (result.failures.some((failure) => failure.sourceName === item.file.name)) {
    return "error";
  }
  return "pending";
}

export type AudioNormalizerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioNormalizeBatchResult) => void;
};

export function AudioNormalizer({ title, onComplete }: AudioNormalizerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [pickError, setPickError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    currentIndex,
    totalCount,
    currentFileName,
    result,
    normalizeBatch,
    reset,
  } = useFfmpegAudioNormalize({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const batchError = validateMp3Batch(incoming);
      if (batchError) {
        setPickError(batchError);
        return;
      }

      setItems((current) => [...current, ...incoming.map(createBatchItem)]);
      setPickError("");
      reset();
    },
    [reset],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((current) => current.filter((item) => item.id !== id));
      reset();
    },
    [reset],
  );

  const normalizeAndDownloadAll = useCallback(async () => {
    if (items.length === 0 || busy) return;

    const files = items.map((item) => item.file);
    const batchError = validateMp3Batch(files);
    if (batchError) {
      setPickError(batchError);
      return;
    }

    const payload = await normalizeBatch(files);
    if (payload?.zipBlob && payload.successes.length > 0) {
      downloadBlob(payload.zipBlob, payload.zipFileName);
    }
  }, [busy, items, normalizeBatch]);

  const canNormalize =
    items.length > 0 && !busy && environment?.canRun !== false;
  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const isDisabled = busy || Boolean(blockingError);

  return (
    <div className="audio-normalizer-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Unify the volume levels of your MP3 files effortlessly. Perfect for creating consistent-sounding playlists. 100% private and local processing."}{" "}
        ffmpeg.wasm applies <code className="text-neutral-500">{LOUDNORM_FILTER}</code> so tracks
        play at a similar perceived loudness—like turning on normalization for a whole playlist.
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      <IndustrialMatteDropzone
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        active={dragActive}
        disabled={isDisabled}
        dropTitle={busy ? "Normalizing in worker…" : "Drop your MP3 files here"}
        selectLabel="Select MP3 from device"
        supportsLabel={formatSupportsLabel(["MP3"])}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (isDisabled) return;
          addFiles(Array.from(event.dataTransfer.files));
        }}
        onClick={() => {
          if (!isDisabled) inputRef.current?.click();
        }}
        input={
          <input
            ref={inputRef}
            type="file"
            accept={MP3_ACCEPT}
            multiple
            disabled={isDisabled}
            className="sr-only"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        }
      />

      {items.length > 0 ? (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {items.length} file{items.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} total
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setItems([]);
                setPickError("");
                reset();
              }}
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-2">
            {items.map((item) => {
              const status = itemStatus(item, result, busy, currentFileName);
              const failure = result?.failures.find(
                (entry) => entry.sourceName === item.file.name,
              );

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 border border-neutral-800 bg-neutral-950 px-3 py-2"
                >
                  <div className="mt-0.5 shrink-0 text-neutral-500">
                    {status === "processing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
                    ) : status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden />
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-100">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{formatBytes(item.file.size)}</p>
                    {failure ? (
                      <p className="mt-1 text-xs text-amber-500/90">{failure.message}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={toolOutlineBtn}
                    disabled={busy}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          {busy && totalCount > 0 ? (
            <p className="text-xs text-neutral-500">
              Processing file {currentIndex} of {totalCount}…
            </p>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canNormalize}
            onClick={() => void normalizeAndDownloadAll()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Normalizing…
              </>
            ) : (
              "Normalize & Download All"
            )}
          </button>
        </div>
      ) : null}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Normalization progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            {result.successes.length} file{result.successes.length === 1 ? "" : "s"} normalized
            {result.failures.length
              ? ` · ${result.failures.length} failed (see list above)`
              : ""}
            .
          </p>
          {result.zipBlob ? (
            <button
              type="button"
              className={toolPrimaryBtn}
              onClick={() => downloadBlob(result.zipBlob!, result.zipFileName)}
            >
              <Download className="mr-2 inline h-4 w-4" aria-hidden />
              Download again
            </button>
          ) : null}
          <PostSuccessUpsell
            operation="audio-normalizer"
            fileContext={
              result.successes.length === 1
                ? result.successes[0].sourceName
                : `${result.successes.length} files`
            }
          />
        </div>
      ) : null}
    </div>
  );
}
