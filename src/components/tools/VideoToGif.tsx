"use client";

import { clsx } from "clsx";
import { Download, Film, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { formatMmSs } from "@/components/tools/ffmpeg/time-input";
import {
  convertVideoToGif,
  formatVideoToGifError,
  VIDEO_TO_GIF_FPS_OPTIONS,
  VIDEO_TO_GIF_SCALE_OPTIONS,
  videoToGifOutputName,
  type VideoToGifFps,
  type VideoToGifOptions,
  type VideoToGifScale,
} from "@/components/tools/ffmpeg/video-to-gif";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const DEFAULT_FPS: VideoToGifFps = 10;
const DEFAULT_SCALE: VideoToGifScale = 320;
const DEFAULT_DURATION = 5;

export type VideoToGifLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  previewLabel: string;
  resultPreviewLabel: string;
  settingsLabel: string;
  startLabel: string;
  durationLabel: string;
  fpsLabel: string;
  scaleLabel: string;
  scaleHint: string;
  videoDurationLabel: string;
  createGif: string;
  creating: string;
  statusProcessing: string;
  statusSuccess: string;
  convertAnother: string;
  tryAgain: string;
  downloadAgain: string;
  rangeError: string;
};

export type VideoToGifProps = {
  labels: VideoToGifLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadGifBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function VideoToGif({ labels, className, onStart, onComplete }: VideoToGifProps) {
  const startId = useId();
  const durationId = useId();
  const fpsId = useId();
  const scaleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const [trackDuration, setTrackDuration] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_DURATION);
  const [fps, setFps] = useState<VideoToGifFps>(DEFAULT_FPS);
  const [scaleWidth, setScaleWidth] = useState<VideoToGifScale>(DEFAULT_SCALE);
  const [pickError, setPickError] = useState("");
  const [rangeError, setRangeError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<VideoToGifOptions>({
      processor: (nextFile, options, callbacks) => convertVideoToGif(nextFile, options, callbacks),
      resolveFileName: (nextFile) => videoToGifOutputName(nextFile.name),
      formatError: formatVideoToGifError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError =
    rangeError || pickError || blockingError || (phase === "error" ? error : undefined);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setTrackDuration(0);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!result?.blob) {
      setGifPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setGifPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const onVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const nextDuration = video.duration;
    setTrackDuration(nextDuration);
    setStartSeconds(0);
    setDurationSeconds(Math.min(DEFAULT_DURATION, nextDuration));
    setRangeError("");
  }, []);

  const pickFile = useCallback(
    (next: File) => {
      if (!isAcceptedVideoFile(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setRangeError("");
      setFile(next);
      setStartSeconds(0);
      setDurationSeconds(DEFAULT_DURATION);
      setTrackDuration(0);
      setFps(DEFAULT_FPS);
      setScaleWidth(DEFAULT_SCALE);
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setPickError("");
    setRangeError("");
    setStartSeconds(0);
    setDurationSeconds(DEFAULT_DURATION);
    setTrackDuration(0);
    setFps(DEFAULT_FPS);
    setScaleWidth(DEFAULT_SCALE);
    reset();
  }, [registerFile, reset]);

  const clampStart = useCallback(
    (value: number) => {
      const max =
        trackDuration > 0 ? Math.max(0, trackDuration - 0.1) : Math.max(0, value);
      return Math.min(Math.max(0, value), max);
    },
    [trackDuration],
  );

  const clampDuration = useCallback(
    (value: number) => {
      const remaining =
        trackDuration > 0 ? Math.max(0.1, trackDuration - startSeconds) : Math.max(0.1, value);
      return Math.min(Math.max(0.1, value), remaining);
    },
    [startSeconds, trackDuration],
  );

  const seekPreview = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.currentTime = seconds;
    } catch {
      /* ignore seek errors while metadata loads */
    }
  }, []);

  const createGif = useCallback(async () => {
    if (!file || busy) return;

    const nextStart = clampStart(startSeconds);
    const nextDuration = clampDuration(durationSeconds);

    if (!(nextDuration > 0)) {
      setRangeError(labels.rangeError);
      return;
    }

    setRangeError("");
    onStart?.();

    const options: VideoToGifOptions = {
      startSeconds: nextStart,
      durationSeconds: nextDuration,
      fps,
      scaleWidth,
    };

    const payload = await process(file, options);
    if (payload) {
      registerFile(file, slug);
    }
  }, [
    busy,
    clampDuration,
    clampStart,
    durationSeconds,
    file,
    fps,
    labels.rangeError,
    onStart,
    process,
    registerFile,
    scaleWidth,
    slug,
    startSeconds,
  ]);

  const canConvert =
    Boolean(file) &&
    trackDuration > 0 &&
    durationSeconds > 0 &&
    !busy &&
    environment?.canRun !== false;

  const startMax = trackDuration > 0 ? trackDuration : 1;
  const durationMax =
    trackDuration > 0 ? Math.max(0.1, trackDuration - startSeconds) : Math.max(durationSeconds, 1);

  return (
    <div className={clsx("video-to-gif-tool space-y-4", className)}>
      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="video"
          accept={VIDEO_TO_MP4_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP4", "MOV", "WEBM", "MKV", "AVI"]}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: labels.dropTitle,
            titleBusy: labels.dropTitleBusy,
            description: labels.dropDescription,
            privacyBadge: labels.privacyBadge,
            formatsHint: labels.formatsHint,
            selectLabel: labels.selectLabel,
          }}
        />
      ) : (
        <div className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              <strong className="text-white">{file.name}</strong>
              {" · "}
              {formatBytes(file.size)}
              {trackDuration > 0 ? ` · ${formatMmSs(trackDuration)}` : null}
            </p>
            <button type="button" className={toolOutlineBtn} disabled={busy} onClick={handleReset}>
              {labels.convertAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          {previewUrl ? (
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {labels.previewLabel}
              </p>
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
                onLoadedMetadata={onVideoMetadata}
              />
            </div>
          ) : null}

          <fieldset className="space-y-5 rounded-none border border-neutral-800 bg-neutral-950 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              {labels.settingsLabel}
            </legend>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-300">
              <span>
                {labels.videoDurationLabel}:{" "}
                <span className="font-semibold text-white">
                  {trackDuration > 0 ? formatMmSs(trackDuration) : "—"}
                </span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={startId} className="text-sm font-medium text-neutral-200">
                  {labels.startLabel}
                </label>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatMmSs(startSeconds)}
                </span>
              </div>
              <input
                id={startId}
                type="range"
                min={0}
                max={startMax}
                step={0.1}
                value={Math.min(startSeconds, startMax)}
                disabled={busy || trackDuration <= 0}
                onChange={(event) => {
                  const next = clampStart(Number(event.target.value));
                  setStartSeconds(next);
                  setDurationSeconds((prev) => clampDuration(prev));
                  setRangeError("");
                  seekPreview(next);
                }}
                className="crop-image-tool__range w-full"
                aria-valuemin={0}
                aria-valuemax={startMax}
                aria-valuenow={startSeconds}
                aria-valuetext={formatMmSs(startSeconds)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={durationId} className="text-sm font-medium text-neutral-200">
                  {labels.durationLabel}
                </label>
                <span className="text-sm font-semibold tabular-nums text-amber-200">
                  {formatMmSs(durationSeconds)}
                </span>
              </div>
              <input
                id={durationId}
                type="range"
                min={0.1}
                max={durationMax}
                step={0.1}
                value={Math.min(durationSeconds, durationMax)}
                disabled={busy || trackDuration <= 0}
                onChange={(event) => {
                  setDurationSeconds(clampDuration(Number(event.target.value)));
                  setRangeError("");
                }}
                className="crop-image-tool__range w-full"
                aria-valuemin={0.1}
                aria-valuemax={durationMax}
                aria-valuenow={durationSeconds}
                aria-valuetext={formatMmSs(durationSeconds)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={fpsId} className="text-sm font-medium text-neutral-200">
                  {labels.fpsLabel}
                </label>
                <select
                  id={fpsId}
                  value={fps}
                  disabled={busy}
                  onChange={(event) => setFps(Number(event.target.value) as VideoToGifFps)}
                  className="w-full px-3 py-2 text-sm text-white"
                >
                  {VIDEO_TO_GIF_FPS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} FPS
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor={scaleId} className="text-sm font-medium text-neutral-200">
                  {labels.scaleLabel}
                </label>
                <select
                  id={scaleId}
                  value={scaleWidth}
                  disabled={busy}
                  onChange={(event) =>
                    setScaleWidth(Number(event.target.value) as VideoToGifScale)
                  }
                  className="w-full px-3 py-2 text-sm text-white"
                >
                  {VIDEO_TO_GIF_SCALE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}px
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500">{labels.scaleHint}</p>
              </div>
            </div>
          </fieldset>

          {phase !== "idle" ? (
            <MediaProcessingStatus
              phase={phase}
              ratio={ratio}
              message={
                phase === "processing" ? labels.statusProcessing : statusMessage || undefined
              }
            />
          ) : null}

          {gifPreviewUrl && phase === "success" && result ? (
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {labels.resultPreviewLabel}
                </p>
                <p className="text-xs text-neutral-400">{formatBytes(result.blob.size)}</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gifPreviewUrl}
                alt={labels.resultPreviewLabel}
                className="mx-auto max-h-80 w-auto max-w-full bg-black object-contain"
              />
              <p className="text-sm text-emerald-400">{labels.statusSuccess}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {!busy && phase !== "success" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canConvert}
                onClick={() => void createGif()}
              >
                {busy || phase === "loading" || phase === "processing" ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    {labels.creating}
                  </>
                ) : (
                  <>
                    <Film className="mr-2 inline h-4 w-4" aria-hidden />
                    {labels.createGif}
                  </>
                )}
              </button>
            ) : null}

            {!busy && phase === "success" && result ? (
              <>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => downloadGifBlob(result.blob, result.fileName)}
                >
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                  {labels.downloadAgain}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.convertAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void createGif()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.convertAnother}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
