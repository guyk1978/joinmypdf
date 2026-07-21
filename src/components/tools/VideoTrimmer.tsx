"use client";

import { clsx } from "clsx";
import { Download, Loader2, Scissors } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { formatMmSs } from "@/components/tools/ffmpeg/time-input";
import {
  formatTrimVideoError,
  isMp4File,
  trimVideo,
  trimVideoOutputName,
} from "@/components/tools/ffmpeg/trim-video";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP4_ACCEPT = "video/mp4,video/x-m4v,.mp4,.m4v";

export type VideoTrimmerLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  previewLabel: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  selectionLabel: string;
  processAndDownload: string;
  processing: string;
  statusProcessing: string;
  processAnother: string;
  tryAgain: string;
  downloadAgain: string;
  successMessage: string;
  rangeError: string;
};

export type VideoTrimmerProps = {
  labels: VideoTrimmerLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoTrimmer({ labels, className, onStart, onComplete }: VideoTrimmerProps) {
  const startId = useId();
  const endId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(1);
  const [pickError, setPickError] = useState("");
  const [rangeError, setRangeError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<{ startSeconds: number; endSeconds: number }>({
      processor: (nextFile, options, callbacks) => trimVideo(nextFile, options, callbacks),
      resolveFileName: (nextFile) => trimVideoOutputName(nextFile.name),
      formatError: formatTrimVideoError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError =
    rangeError || pickError || blockingError || (phase === "error" ? error : undefined);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDuration(0);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const trackDuration = video.duration;
    setDuration(trackDuration);
    setStartSeconds(0);
    setEndSeconds(trackDuration);
    setRangeError("");
  }, []);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp4File(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setRangeError("");
      setFile(next);
      setStartSeconds(0);
      setEndSeconds(1);
      setDuration(0);
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
    setEndSeconds(1);
    setDuration(0);
    reset();
  }, [registerFile, reset]);

  const clampStart = useCallback(
    (value: number) => {
      const max = duration > 0 ? Math.max(0, endSeconds - 0.1) : value;
      return Math.min(Math.max(0, value), max);
    },
    [duration, endSeconds],
  );

  const clampEnd = useCallback(
    (value: number) => {
      const min = Math.min(startSeconds + 0.1, duration || startSeconds + 0.1);
      const max = duration > 0 ? duration : value;
      return Math.min(Math.max(min, value), max);
    },
    [duration, startSeconds],
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

  const trimAndDownload = useCallback(async () => {
    if (!file || busy) return;

    if (!(startSeconds < endSeconds)) {
      setRangeError(labels.rangeError);
      return;
    }

    setRangeError("");
    onStart?.();
    const payload = await process(file, { startSeconds, endSeconds });
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [
    busy,
    endSeconds,
    file,
    labels.rangeError,
    onStart,
    process,
    registerFile,
    slug,
    startSeconds,
  ]);

  const canTrim =
    Boolean(file) &&
    duration > 0 &&
    startSeconds < endSeconds &&
    !busy &&
    environment?.canRun !== false;

  const selectionLength = Math.max(0, endSeconds - startSeconds);
  const maxAttr = duration > 0 ? duration : 1;

  return (
    <div className={clsx("video-trimmer-tool space-y-4", className)}>
      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="video"
          accept={MP4_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP4"]}
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
              {duration > 0 ? ` · ${formatMmSs(duration)}` : null}
            </p>
            <button type="button" className={toolOutlineBtn} disabled={busy} onClick={handleReset}>
              {labels.processAnother}
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
                preload="metadata"
                className="aspect-video w-full bg-black"
                onLoadedMetadata={onVideoMetadata}
              />
            </div>
          ) : null}

          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-300">
              <span>
                {labels.durationLabel}:{" "}
                <span className="font-semibold text-white">
                  {duration > 0 ? formatMmSs(duration) : "—"}
                </span>
              </span>
              <span>
                {labels.selectionLabel}:{" "}
                <span className="font-semibold text-amber-200">{formatMmSs(selectionLength)}</span>
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
                max={maxAttr}
                step={0.1}
                value={Math.min(startSeconds, maxAttr)}
                disabled={busy || duration <= 0}
                onChange={(event) => {
                  const next = clampStart(Number(event.target.value));
                  setStartSeconds(next);
                  setRangeError("");
                  seekPreview(next);
                }}
                className="crop-image-tool__range w-full"
                aria-valuemin={0}
                aria-valuemax={maxAttr}
                aria-valuenow={startSeconds}
                aria-valuetext={formatMmSs(startSeconds)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={endId} className="text-sm font-medium text-neutral-200">
                  {labels.endLabel}
                </label>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatMmSs(endSeconds)}
                </span>
              </div>
              <input
                id={endId}
                type="range"
                min={0}
                max={maxAttr}
                step={0.1}
                value={Math.min(endSeconds, maxAttr)}
                disabled={busy || duration <= 0}
                onChange={(event) => {
                  const next = clampEnd(Number(event.target.value));
                  setEndSeconds(next);
                  setRangeError("");
                  seekPreview(next);
                }}
                className="crop-image-tool__range w-full"
                aria-valuemin={0}
                aria-valuemax={maxAttr}
                aria-valuenow={endSeconds}
                aria-valuetext={formatMmSs(endSeconds)}
              />
            </div>
          </div>

          {phase !== "idle" ? (
            <MediaProcessingStatus
              phase={phase}
              ratio={ratio}
              message={
                phase === "processing" ? labels.statusProcessing : statusMessage || undefined
              }
            />
          ) : null}

          <div className="flex flex-wrap gap-3">
            {!busy && phase !== "success" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canTrim}
                onClick={() => void trimAndDownload()}
              >
                {busy || phase === "loading" || phase === "processing" ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    {labels.processing}
                  </>
                ) : (
                  <>
                    <Scissors className="mr-2 inline h-4 w-4" aria-hidden />
                    {labels.processAndDownload}
                  </>
                )}
              </button>
            ) : null}

            {!busy && phase === "success" && result ? (
              <>
                <p className="w-full text-sm text-emerald-400">
                  {labels.successMessage.replace("{size}", formatBytes(result.blob.size))}
                </p>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => downloadVideoBlob(result.blob, result.fileName)}
                >
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                  {labels.downloadAgain}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.processAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => void trimAndDownload()}
                >
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.processAnother}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
