"use client";

import { clsx } from "clsx";
import { Download, Gauge, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { MAX_SPEED, MIN_SPEED } from "@/components/tools/ffmpeg/change-mp3-speed";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import {
  useFfmpegMp3Speed,
  type FfmpegMp3SpeedResult,
} from "@/components/tools/hooks/useFfmpegMp3Speed";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP3_ACCEPT = "audio/mpeg,audio/mp3,.mp3";

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

function formatSpeedLabel(speed: number): string {
  return `${speed.toFixed(1)}×`;
}

export type Mp3SpeedChangerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegMp3SpeedResult) => void;
};

export function Mp3SpeedChanger({ title, onComplete }: Mp3SpeedChangerProps) {
  const sliderId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [changedUrl, setChangedUrl] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.5);
  const [pickError, setPickError] = useState("");
  const [rangeError, setRangeError] = useState("");

  const {
    environment,
    phase,
    ratio,
    statusMessage,
    error,
    busy,
    result,
    changeSpeed,
    reset,
  } = useFfmpegMp3Speed({ onComplete });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError =
    pickError || rangeError || blockingError || (phase === "error" ? error : undefined);

  const speedOutOfRange = speed < MIN_SPEED || speed > MAX_SPEED;
  const speedUnchanged = Math.abs(speed - 1) < 0.05;

  useEffect(() => {
    if (!file) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!result?.blob) {
      setChangedUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setChangedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp3File(next)) {
        setPickError(
          "Invalid or unsupported file. Please upload a valid MP3 audio file for speed adjustment.",
        );
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [reset],
  );

  const handleSpeedChange = useCallback((value: number) => {
    setSpeed(value);
    if (value < MIN_SPEED || value > MAX_SPEED) {
      setRangeError(`Speed must stay between ${MIN_SPEED}x and ${MAX_SPEED}x for atempo quality.`);
    } else {
      setRangeError("");
    }
  }, []);

  const changeSpeedAndDownload = useCallback(async () => {
    if (!file || busy || speedOutOfRange || speedUnchanged) return;

    const payload = await changeSpeed({ file, speed });
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, changeSpeed, file, speed, speedOutOfRange, speedUnchanged]);

  const canChange =
    Boolean(file) &&
    !busy &&
    !speedOutOfRange &&
    !speedUnchanged &&
    environment?.canRun !== false;

  return (
    <div className="mp3-speed-changer-tool space-y-4">
      <p className="text-sm leading-relaxed text-neutral-400">
        {title ??
          "Change the playback speed of your MP3 files without altering the pitch. Perfect for podcasts and audiobooks. 100% private and local."}{" "}
        ffmpeg.wasm uses the <code className="text-neutral-500">atempo</code> filter in a Web Worker
        so tempo changes do not shift pitch.
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
            titleBusy: "Changing speed in worker…",
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
                setRangeError("");
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-neutral-300" htmlFor={sliderId}>
                Playback speed
              </label>
              <span className="text-sm font-semibold tabular-nums text-neutral-100">
                {formatSpeedLabel(speed)}
              </span>
            </div>
            <input
              id={sliderId}
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.1}
              value={speed}
              disabled={busy}
              onChange={(event) => handleSpeedChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-none bg-neutral-800 accent-neutral-100"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{MIN_SPEED}× slower</span>
              <span>1.0× normal</span>
              <span>{MAX_SPEED}× faster</span>
            </div>
            {speedOutOfRange ? (
              <p className="text-xs text-amber-500">
                Speed must stay between {MIN_SPEED}x and {MAX_SPEED}x.
              </p>
            ) : speedUnchanged ? (
              <p className="text-xs text-neutral-500">
                Move the slider away from 1.0× to change playback speed.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Original
              </p>
              {originalUrl ? (
                <audio src={originalUrl} controls preload="metadata" className="w-full" />
              ) : null}
            </div>
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Speed adjusted
              </p>
              {changedUrl ? (
                <audio src={changedUrl} controls preload="metadata" className="w-full" />
              ) : (
                <p className="py-4 text-center text-xs text-neutral-500">
                  Process the file to preview the new speed here.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
            disabled={!canChange}
            onClick={() => void changeSpeedAndDownload()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                Processing…
              </>
            ) : (
              <>
                <Gauge className="mr-2 inline h-4 w-4" aria-hidden />
                Change Speed &amp; Download
              </>
            )}
          </button>
        </div>
      )}

      {phase === "loading" || phase === "processing" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Speed change progress
        </p>
      ) : null}

      <MediaProcessingStatus phase={phase} ratio={ratio} message={statusMessage} />

      {result && phase === "success" ? (
        <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-emerald-400">
            Speed set to {formatSpeedLabel(result.speed)} — {formatBytes(result.blob.size)} MP3
            ready to download.
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
            operation="mp3-speed-changer"
            fileContext={file?.name}
            sourceFile={file}
          />
        </div>
      ) : null}
    </div>
  );
}
