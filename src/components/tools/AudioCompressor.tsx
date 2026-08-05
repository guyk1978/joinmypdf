"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { estimateCompressedBytes } from "@/components/tools/ffmpeg/compress-audio";
import {
  detectMp3BitrateFromBytes,
  estimateBitrateFromSize,
  snapBitrateKbps,
} from "@/components/tools/ffmpeg/mp3-bitrate";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegAudioCompress,
  type FfmpegAudioCompressResult,
} from "@/components/tools/hooks/useFfmpegAudioCompress";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";
const BITRATE_OPTIONS = [64, 96, 128, 192] as const;
type BitrateOption = (typeof BITRATE_OPTIONS)[number];

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

function pickDefaultTargetBitrate(originalKbps: number): BitrateOption {
  const candidates = BITRATE_OPTIONS.filter((value) => value < originalKbps);
  if (candidates.length) return candidates[candidates.length - 1];
  return BITRATE_OPTIONS[0];
}

async function readMp3SourceBitrate(
  file: File,
  durationSeconds: number | null,
): Promise<number | null> {
  try {
    const buffer = await file.slice(0, Math.min(file.size, 512 * 1024)).arrayBuffer();
    const fromFrames = detectMp3BitrateFromBytes(new Uint8Array(buffer));
    if (fromFrames) return fromFrames;
  } catch {
    // fall through
  }
  const estimated = estimateBitrateFromSize(file.size, durationSeconds);
  return estimated ? snapBitrateKbps(estimated) : null;
}

export type AudioCompressorProps = ToolModuleProps & {
  onComplete?: (result: FfmpegAudioCompressResult) => void;
};

export function AudioCompressor({ name, onComplete }: AudioCompressorProps) {
  const bitrateId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [sourceBitrateKbps, setSourceBitrateKbps] = useState<number | null>(null);
  const [bitrateKbps, setBitrateKbps] = useState<BitrateOption>(96);
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

  const targetInflates =
    sourceBitrateKbps !== null && bitrateKbps >= sourceBitrateKbps;
  const noLowerOption =
    sourceBitrateKbps !== null &&
    !BITRATE_OPTIONS.some((value) => value < sourceBitrateKbps);

  const estimatedBytes =
    file && !result && !targetInflates
      ? estimateCompressedBytes(duration, file.size, bitrateKbps)
      : null;
  const estimatedSavings =
    file && estimatedBytes !== null ? savingsPercent(file.size, estimatedBytes) : 0;

  useEffect(() => {
    if (!file) {
      setDuration(null);
      setSourceBitrateKbps(null);
      return;
    }

    let cancelled = false;
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;

    const finishBitrate = async (durationSeconds: number | null) => {
      const detected = await readMp3SourceBitrate(file, durationSeconds);
      if (cancelled) return;
      setSourceBitrateKbps(detected);
      if (detected) setBitrateKbps(pickDefaultTargetBitrate(detected));
    };

    const onMetadata = () => {
      const next =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
      setDuration(next);
      void finishBitrate(next);
    };
    const onError = () => {
      setDuration(null);
      void finishBitrate(null);
    };

    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("error", onError);

    return () => {
      cancelled = true;
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
      setSourceBitrateKbps(null);
      setBitrateKbps(96);
      reset();
    },
    [reset],
  );

  const compressAndDownload = useCallback(async () => {
    if (!file || busy) return;
    if (sourceBitrateKbps !== null && bitrateKbps >= sourceBitrateKbps) {
      setPickError(
        `Target bitrate (${bitrateKbps} kbps) must be lower than the original (~${sourceBitrateKbps} kbps) to compress the file.`,
      );
      return;
    }
    const payload = await compress(file, bitrateKbps);
    if (payload) downloadBlob(payload.blob, payload.fileName);
  }, [bitrateKbps, busy, compress, file, sourceBitrateKbps]);

  const canCompress = useMemo(
    () =>
      Boolean(file) &&
      !busy &&
      environment?.canRun !== false &&
      !targetInflates &&
      !noLowerOption,
    [busy, environment?.canRun, file, noLowerOption, targetInflates],
  );

  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    setFile(next);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  return (
    <div className="audio-compressor-tool space-y-4">
      <FfmpegEnvironmentNotice
        environment={environment}
        error={displayError && phase === "error" ? displayError : pickError || blockingError}
      />

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
        <div className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              {file.name} · {formatBytes(file.size)}
              {sourceBitrateKbps ? (
                <span className="text-neutral-400"> · ~{sourceBitrateKbps} kbps</span>
              ) : null}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setPickError("");
                setDuration(null);
                setSourceBitrateKbps(null);
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
              onChange={(event) => {
                setBitrateKbps(Number(event.target.value) as BitrateOption);
                setPickError("");
              }}
              className={clsx(
                "w-full rounded-none border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500",
                targetInflates ? "border-amber-500 ring-1 ring-amber-500/40" : "border-neutral-700",
              )}
              aria-invalid={targetInflates || undefined}
            >
              {BITRATE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} kbps
                  {sourceBitrateKbps !== null && value >= sourceBitrateKbps
                    ? " — larger / no savings"
                    : ""}
                </option>
              ))}
            </select>
            {sourceBitrateKbps !== null && targetInflates ? (
              <p className="text-sm text-amber-400" role="status">
                Original bitrate is about {sourceBitrateKbps} kbps. Choose a lower target so the
                file actually gets smaller — a higher target can inflate the file size.
              </p>
            ) : null}
            {noLowerOption ? (
              <p className="text-sm text-amber-400" role="status">
                This file is already at or below {BITRATE_OPTIONS[0]} kbps, so further compression
                is not available.
              </p>
            ) : null}
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
            onClick={() => void compressAndDownload()}
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
        <div className="tool-workspace-panel space-y-3">
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
