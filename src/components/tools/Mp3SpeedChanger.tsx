"use client";

import { clsx } from "clsx";
import { Download, Gauge, Loader2, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  MAX_SPEED,
  MIN_SPEED,
  PRESET_SPEEDS,
  isSupportedSpeedFile,
} from "@/components/tools/ffmpeg/change-mp3-speed";
import {
  useFfmpegMp3Speed,
  type FfmpegMp3SpeedResult,
} from "@/components/tools/hooks/useFfmpegMp3Speed";
import type { ToolModuleProps } from "@/lib/tool-module";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const AUDIO_ACCEPT =
  "audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/ogg,audio/aac,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.oga,.aac,.m4a";

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
  if (Number.isInteger(speed)) return `${speed}.0×`;
  return `${speed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
}

function applyPreviewTransport(
  audio: HTMLAudioElement | null,
  speed: number,
  maintainPitch: boolean,
): void {
  if (!audio) return;
  audio.playbackRate = speed;
  // Chromium / Safari / Firefox expose preservesPitch for WSOLA-like live time-stretch.
  try {
    audio.preservesPitch = maintainPitch;
  } catch {
    /* older engines */
  }
  try {
    // Legacy WebKit prefix
    (audio as HTMLAudioElement & { mozPreservesPitch?: boolean }).mozPreservesPitch =
      maintainPitch;
  } catch {
    /* ignore */
  }
}

export type Mp3SpeedChangerProps = ToolModuleProps & {
  onComplete?: (result: FfmpegMp3SpeedResult) => void;
};

export function Mp3SpeedChanger({ title, onComplete }: Mp3SpeedChangerProps) {
  const sliderId = useId();
  const pitchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLAudioElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.25);
  const [maintainPitch, setMaintainPitch] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [pickError, setPickError] = useState("");
  const [dragActive, setDragActive] = useState(false);

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
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const speedOutOfRange = speed < MIN_SPEED || speed > MAX_SPEED;
  const speedUnchanged = Math.abs(speed - 1) < 0.01;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    applyPreviewTransport(previewRef.current, speed, maintainPitch);
  }, [speed, maintainPitch, previewUrl]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isSupportedSpeedFile(next)) {
        setPickError(
          `Invalid file "${next.name}". Please upload MP3, WAV, AAC/M4A, or OGG.`,
        );
        return;
      }
      setFile(next);
      setPickError("");
      setPlaying(false);
      reset();
    },
    [reset],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      const next = incoming[0];
      if (!next) return;
      pickFile(next);
    },
    [pickFile],
  );

  const togglePreview = useCallback(async () => {
    const audio = previewRef.current;
    if (!audio || !previewUrl) return;

    applyPreviewTransport(audio, speed, maintainPitch);

    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [maintainPitch, previewUrl, speed]);

  const applyAndDownload = useCallback(async () => {
    if (!file || busy || speedOutOfRange || speedUnchanged) return;

    const payload = await changeSpeed({ file, speed, maintainPitch });
    if (payload) {
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, changeSpeed, file, maintainPitch, speed, speedOutOfRange, speedUnchanged]);

  const canApply =
    Boolean(file) &&
    !busy &&
    !speedOutOfRange &&
    !speedUnchanged &&
    environment?.canRun !== false;

  const isDisabled = busy || Boolean(blockingError);

  return (
    <div className="audio-speed-changer-tool space-y-4">

      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <IndustrialMatteDropzone
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled}
          active={dragActive}
          disabled={isDisabled}
          dropTitle={busy ? "Changing speed in worker…" : "Drop an audio file"}
          selectLabel="Select audio from device"
          supportsLabel={formatSupportsLabel(["MP3", "WAV", "AAC", "M4A", "OGG"])}
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
              accept={AUDIO_ACCEPT}
              disabled={isDisabled}
              className="sr-only"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          }
        />
      ) : (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm">
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
                setPlaying(false);
                reset();
              }}
            >
              Choose another file
            </button>
          </div>

          <fieldset className="space-y-3 border border-neutral-800 bg-neutral-950 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Speed control
            </legend>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-medium text-neutral-300" htmlFor={sliderId}>
                Playback speed
              </label>
              <span className="font-mono text-lg font-semibold tabular-nums text-neutral-100">
                {formatSpeedLabel(speed)}
              </span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.05}
              value={speed}
              disabled={busy}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-none bg-neutral-800 accent-neutral-100"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{MIN_SPEED}× slower</span>
              <span>1.0× normal</span>
              <span>{MAX_SPEED}× faster</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Preset speeds
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SPEEDS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={clsx(
                      toolOutlineBtn,
                      Math.abs(speed - preset) < 0.001 &&
                        "border-neutral-400 text-neutral-100",
                    )}
                    disabled={busy}
                    onClick={() => setSpeed(preset)}
                  >
                    {formatSpeedLabel(preset)}
                  </button>
                ))}
                <button
                  type="button"
                  className={toolOutlineBtn}
                  disabled={busy}
                  onClick={() => setSpeed(1)}
                >
                  1.0×
                </button>
              </div>
            </div>

            <label
              className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
              htmlFor={pitchId}
            >
              <input
                id={pitchId}
                type="checkbox"
                className="accent-neutral-200"
                checked={maintainPitch}
                disabled={busy}
                onChange={(event) => setMaintainPitch(event.target.checked)}
              />
              Maintain pitch (time-stretching)
              <span className="text-xs text-neutral-500">— on by default</span>
            </label>
          </fieldset>

          <div className="space-y-3 rounded-none border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Live preview
              </p>
              <button
                type="button"
                className={toolOutlineBtn}
                disabled={!previewUrl || busy}
                onClick={() => void togglePreview()}
              >
                {playing ? (
                  <>
                    <Pause className="mr-1.5 inline h-4 w-4" aria-hidden />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 inline h-4 w-4" aria-hidden />
                    Play at {formatSpeedLabel(speed)}
                  </>
                )}
              </button>
            </div>
            {previewUrl ? (
              <audio
                ref={previewRef}
                src={previewUrl}
                controls
                preload="metadata"
                className="w-full"
                onPlay={() => {
                  applyPreviewTransport(previewRef.current, speed, maintainPitch);
                  setPlaying(true);
                }}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />
            ) : null}
            <p className="text-xs text-neutral-500">
              Preview uses the browser time-stretch engine (
              {maintainPitch ? "pitch locked" : "pitch follows speed"}). Export applies the same
              mode via ffmpeg.wasm — still 100% local.
            </p>
          </div>

          {speedOutOfRange ? (
            <p className="text-xs text-amber-500">
              Speed must stay between {MIN_SPEED}× and {MAX_SPEED}×.
            </p>
          ) : speedUnchanged ? (
            <p className="text-xs text-neutral-500">
              Move the slider or pick a preset away from 1.0× to change speed.
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
                Processing…
              </>
            ) : (
              <>
                <Gauge className="mr-2 inline h-4 w-4" aria-hidden />
                Apply &amp; Download
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
            Speed set to {formatSpeedLabel(result.speed)}
            {result.maintainPitch ? " (pitch maintained)" : " (pitch linked)"} —{" "}
            {formatBytes(result.blob.size)} ready.
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
