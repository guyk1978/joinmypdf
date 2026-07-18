"use client";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { estimateCompressedBytes } from "@/components/tools/ffmpeg/compress-audio";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegAudioCompress,
  type FfmpegAudioCompressResult,
} from "@/components/tools/hooks/useFfmpegAudioCompress";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";
const BITRATE_OPTIONS = [64, 96, 128, 192] as const;

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

function savingsPercent(originalBytes: number, estimatedBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.max(0, Math.round((1 - estimatedBytes / originalBytes) * 100));
}

export type AudioCompressorProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioCompressResult) => void;
};

export function AudioCompressor({ name, onComplete }: AudioCompressorProps) {
  const bitrateId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [bitrateKbps, setBitrateKbps] = useState<(typeof BITRATE_OPTIONS)[number]>(128);
  const [pickError, setPickError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    compress,
    reset,
  } = useFfmpegAudioCompress({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || error;

  const estimatedBytes =
    file && !result ? estimateCompressedBytes(duration, file.size, bitrateKbps) : null;
  const estimatedSavings =
    file && estimatedBytes !== null ? savingsPercent(file.size, estimatedBytes) : 0;

  useEffect(() => {
    if (!file) {
      setDuration(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;

    const onMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onError = () => setDuration(null);

    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("error", onError);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError(
          "Unsupported format. Please upload a valid MP3 file — compression runs locally in your browser.",
        );
        return;
      }
      setFile(next);
      setPickError("");
      setDuration(null);
      reset();
    },
    [reset],
  );

  const canCompress = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className="audio-compressor-tool space-y-4">

      <FfmpegEnvironmentNotice
        environment={environment}
        error={displayError && phase === "error" ? displayError : pickError || blockingError}
      />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="audio"
          accept={MP3_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP3"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: `Upload MP3 for ${name}`,
            titleBusy: "Compressing in worker…",
            description: "Drag and drop an MP3 or browse from your device.",
            privacyBadge: "100% Private — processed locally with ffmpeg.wasm.",
          }}
          className="rounded-none border-neutral-800 bg-[#1a1a1a]"
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setPickError("");
                setDuration(null);
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300" htmlFor={bitrateId}>
              Target bitrate
            </label>
            <select
              id={bitrateId}
              value={bitrateKbps}
              disabled={busy}
              onChange={(event) =>
                setBitrateKbps(Number(event.target.value) as (typeof BITRATE_OPTIONS)[number])
              }
              className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              {BITRATE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} kbps
                </option>
              ))}
            </select>
          </div>

          {estimatedBytes !== null ? (
            <div className="grid gap-3 rounded-none border border-neutral-800 bg-neutral-950 p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Original size
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-100">{formatBytes(file.size)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Estimated new size
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-100">
                  ~{formatBytes(estimatedBytes)}
                  {estimatedSavings > 0 ? (
                    <span className="ml-2 text-emerald-400">(~{estimatedSavings}% smaller)</span>
                  ) : null}
                </p>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canCompress}
            onClick={() => void compress(file, bitrateKbps)}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Compressing…
              </>
            ) : (
              "Compress audio"
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Compression progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Original size
              </p>
              <p className="mt-1 text-sm text-neutral-300">{formatBytes(result.originalBytes)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Compressed size
              </p>
              <p className="mt-1 text-sm text-emerald-400">
                {formatBytes(result.compressedBytes)}
                {result.compressedBytes < result.originalBytes ? (
                  <span className="ml-2 text-neutral-400">
                    ({savingsPercent(result.originalBytes, result.compressedBytes)}% saved)
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download compressed file
          </button>
          <PostSuccessUpsell
            operation="audio-compressor"
            fileContext={file?.name}
            sourceFile={file}
          />
        </div>
      ) : null}
    </div>
  );
}
