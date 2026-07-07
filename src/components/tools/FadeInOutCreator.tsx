"use client";

import { clsx } from "clsx";
import { Download, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  MIN_FADE_SECONDS,
  validateFadeDurations,
} from "@/components/tools/ffmpeg/fade-audio";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegFadeInOut,
  type FfmpegFadeResult,
} from "@/components/tools/hooks/useFfmpegFadeInOut";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parsePositiveSeconds(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export type FadeInOutCreatorProps = ToolModuleProps & {
  onComplete?: (result: FfmpegFadeResult) => void;
};

export function FadeInOutCreator({ title, onComplete }: FadeInOutCreatorProps) {
  const fadeInId = useId();
  const fadeOutId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [fadeInSeconds, setFadeInSeconds] = useState("2");
  const [fadeOutSeconds, setFadeOutSeconds] = useState("2");
  const [pickError, setPickError] = useState("");
  const [validationError, setValidationError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    applyFade,
    reset,
  } = useFfmpegFadeInOut({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError =
    pickError || validationError || blockingError || (phase === "error" ? error : undefined);

  const fadeInValue = parsePositiveSeconds(fadeInSeconds);
  const fadeOutValue = parsePositiveSeconds(fadeOutSeconds);

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

  useEffect(() => {
    if (!file) {
      setValidationError("");
      return;
    }
    const message = validateFadeDurations(fadeInValue, fadeOutValue, duration);
    setValidationError(message ?? "");
  }, [duration, fadeInValue, fadeOutValue, file]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError(
          "Invalid or unsupported file. Please upload a valid MP3 audio file for fade effects.",
        );
        return;
      }
      setFile(next);
      setPickError("");
      setFadeInSeconds("2");
      setFadeOutSeconds("2");
      reset();
    },
    [reset],
  );

  const applyAndDownload = useCallback(async () => {
    if (!file || busy || !duration || validationError) return;

    const payload = await applyFade({
      file,
      audioDurationSeconds: duration,
      fadeInSeconds: fadeInValue,
      fadeOutSeconds: fadeOutValue,
    });
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [applyFade, busy, duration, fadeInValue, fadeOutValue, file, validationError]);

  const canApply =
    Boolean(file) &&
    Boolean(duration) &&
    !validationError &&
    !busy &&
    environment?.canRun !== false;

  return (
    <div className="fade-in-out-creator-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Add professional fade-in and fade-out effects to your audio files locally. Fast, secure, and 100% private."}{" "}
        ffmpeg.wasm applies <code className="text-neutral-500">afade</code> filters in a Web Worker
        so fades are rendered without uploading your track.
      </p>

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

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
            title: "Upload MP3",
            titleBusy: "Applying fades in worker…",
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
              {duration ? (
                <span className="ml-2 text-neutral-500">· {formatDuration(duration)}</span>
              ) : (
                <span className="ml-2 text-neutral-500">Reading duration…</span>
              )}
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={busy}
              onClick={() => {
                setFile(null);
                setDuration(null);
                setPickError("");
                setValidationError("");
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300" htmlFor={fadeInId}>
                Fade-in duration (seconds)
              </label>
              <input
                id={fadeInId}
                type="number"
                min={MIN_FADE_SECONDS}
                step={0.1}
                value={fadeInSeconds}
                disabled={busy}
                onChange={(event) => setFadeInSeconds(event.target.value)}
                className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              />
              <p className="text-xs text-neutral-500">Fades from silence at the start (ss=0).</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300" htmlFor={fadeOutId}>
                Fade-out duration (seconds)
              </label>
              <input
                id={fadeOutId}
                type="number"
                min={MIN_FADE_SECONDS}
                step={0.1}
                value={fadeOutSeconds}
                disabled={busy}
                onChange={(event) => setFadeOutSeconds(event.target.value)}
                className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              />
              <p className="text-xs text-neutral-500">
                Fades to silence at the end (auto-aligned to track length).
              </p>
            </div>
          </div>

          {duration && !validationError ? (
            <p className="text-xs text-neutral-500">
              Fade-out starts at ~{Math.max(0, duration - fadeOutValue).toFixed(1)}s on a{" "}
              {duration.toFixed(1)}s track.
            </p>
          ) : null}

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canApply}
            onClick={() => void applyAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Applying fades…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 inline h-4 w-4" aria-hidden />
                Apply &amp; Download
              </>
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Fade processing progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Applied {result.fadeInSeconds.toFixed(1)}s fade-in and {result.fadeOutSeconds.toFixed(1)}
            s fade-out — {formatBytes(result.blob.size)} MP3 ready to download.
          </p>
          <button
            type="button"
            className={toolPrimaryBtn}
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <Download className="mr-2 inline h-4 w-4" aria-hidden />
            Download again
          </button>
          <PostSuccessUpsell
            operation="fade-in-out-creator"
            fileContext={file?.name}
            sourceFile={file}
          />
        </div>
      ) : null}
    </div>
  );
}
