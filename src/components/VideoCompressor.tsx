"use client";

import { clsx } from "clsx";
import { Download, Loader2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { VideoSizeCompare, type VideoSizeCompareLabels } from "@/components/media/VideoSizeCompare";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import { getFfmpegEnvironmentStatus } from "@/components/tools/ffmpeg/ffmpeg-environment";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { formatBytes } from "@/lib/pdf-engine";
import {
  averageBitrateKbps,
  clampVideoCompressCrf,
  DEFAULT_VIDEO_COMPRESS_CRF,
  downloadVideoBlob,
  estimateCompressedBytes,
  formatBitrateKbps,
  isAcceptedVideoFile,
  videoCompressorOutputName,
  VIDEO_COMPRESS_CRF_MAX,
  VIDEO_COMPRESS_CRF_MIN,
  VIDEO_TO_MP4_ACCEPT,
} from "@/lib/video-compressor";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";
import {
  bootstrapMediaTools,
  getVideoManager,
  type MediaProcessingPhase,
  type MediaProgress,
} from "@/services/media";

export type VideoCompressorLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  compressInstructions: string;
  crfLabel: string;
  crfHint: string;
  crfValue: string;
  compressionLow: string;
  compressionMedium: string;
  compressionHigh: string;
  estimatedSize: string;
  originalBitrate: string;
  estimatedBitrate: string;
  resultBitrate: string;
  compressAndDownload: string;
  compressing: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  compressAnother: string;
  tryAgain: string;
  downloadAgain: string;
  sizeCompare: VideoSizeCompareLabels;
};

export type VideoCompressorProps = {
  labels: VideoCompressorLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: (blob: Blob, filename: string, originalBytes: number, compressedBytes: number) => void;
};

function presetNearestCrf(crf: number): "low" | "medium" | "high" {
  if (crf <= 20) return "low";
  if (crf >= 26) return "high";
  return "medium";
}

export function VideoCompressor({ labels, className, onStart, onComplete }: VideoCompressorProps) {
  const sliderId = useId();
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [crf, setCrf] = useState(DEFAULT_VIDEO_COMPRESS_CRF);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const environment = useMemo(() => getFfmpegEnvironmentStatus(), []);
  const blockingError = environment && !environment.canRun ? environment.blockingMessage : undefined;

  useEffect(() => {
    bootstrapMediaTools();
    return () => {
      unsubRef.current?.();
    };
  }, []);

  const estimatedBytes = useMemo(
    () => (file ? estimateCompressedBytes(file.size, crf) : 0),
    [crf, file],
  );

  const originalBitrate = useMemo(
    () => (file ? averageBitrateKbps(file.size, durationSeconds) : null),
    [durationSeconds, file],
  );

  const estimatedBitrate = useMemo(
    () => averageBitrateKbps(estimatedBytes, durationSeconds),
    [durationSeconds, estimatedBytes],
  );

  const resultBitrate = useMemo(
    () => (result ? averageBitrateKbps(result.blob.size, durationSeconds) : null),
    [durationSeconds, result],
  );

  const reset = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    registerFile(null);
    setFile(null);
    setCrf(DEFAULT_VIDEO_COMPRESS_CRF);
    setDurationSeconds(0);
    setPhase("idle");
    setRatio(0);
    setStatusMessage("");
    setError("");
    setBusy(false);
    setResult(null);
  }, [registerFile]);

  const onProgress = useCallback((progress: MediaProgress) => {
    setPhase(progress.phase);
    setRatio(progress.ratio);
    if (progress.message) setStatusMessage(progress.message);
  }, []);

  const loadDuration = useCallback(async (next: File) => {
    try {
      const meta = await getVideoManager().getMetadata(next);
      setDurationSeconds(meta.durationSeconds > 0 ? meta.durationSeconds : 0);
    } catch {
      setDurationSeconds(0);
    }
  }, []);

  const pickFile = useCallback(
    (next: File) => {
      if (!isAcceptedVideoFile(next)) {
        setError(labels.invalidFile);
        return;
      }
      setFile(next);
      setError("");
      setCrf(DEFAULT_VIDEO_COMPRESS_CRF);
      setPhase("idle");
      setRatio(0);
      setStatusMessage("");
      setResult(null);
      void loadDuration(next);
    },
    [labels.invalidFile, loadDuration],
  );

  const compressFile = useCallback(async () => {
    if (!file || busy) return;
    if (blockingError) {
      setError(blockingError);
      setPhase("error");
      return;
    }

    const nextCrf = clampVideoCompressCrf(crf);
    setError("");
    setBusy(true);
    setPhase("loading");
    setRatio(0);
    setStatusMessage(labels.statusLoading);
    setResult(null);

    onStart?.();
    const video = getVideoManager();
    unsubRef.current?.();
    unsubRef.current = video.onProgress(onProgress);

    try {
      const blob = await video.compress(file, { crf: nextCrf });
      const fileName = videoCompressorOutputName(file);
      setResult({ blob, fileName });
      setPhase("success");
      setRatio(1);
      setStatusMessage(labels.statusSuccess);
      registerFile(file, slug);
      downloadVideoBlob(blob, fileName);
      onComplete?.(blob, fileName, file.size, blob.size);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : labels.statusError;
      setPhase("error");
      setRatio(0);
      setStatusMessage(message);
      setError(message);
    } finally {
      unsubRef.current?.();
      unsubRef.current = null;
      setBusy(false);
    }
  }, [
    blockingError,
    busy,
    crf,
    file,
    labels.statusError,
    labels.statusLoading,
    labels.statusSuccess,
    onComplete,
    onProgress,
    onStart,
    registerFile,
    slug,
  ]);

  const preset = presetNearestCrf(crf);
  const displayError = error || blockingError;

  return (
    <div className={clsx("video-compressor-tool space-y-4", className)}>
      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {!file ? (
        <MediaDropzone
          mediaKind="video"
          accept={VIDEO_TO_MP4_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP4", "MOV", "WEBM", "MKV", "AVI"]}
          onFile={pickFile}
          onError={(message) => setError(message)}
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
            </p>
            <button type="button" className={toolOutlineBtn} disabled={busy} onClick={reset}>
              {labels.compressAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.compressInstructions}</p>

          <fieldset className="space-y-4 rounded-none border border-neutral-800 bg-neutral-950 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              {labels.crfLabel}
            </legend>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={sliderId} className="text-sm font-medium text-neutral-200">
                {labels.crfLabel}
              </label>
              <span className="text-sm font-semibold tabular-nums text-amber-200">
                {labels.crfValue.replace("{crf}", String(crf))}
              </span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={VIDEO_COMPRESS_CRF_MIN}
              max={VIDEO_COMPRESS_CRF_MAX}
              step={1}
              value={crf}
              onChange={(event) => setCrf(clampVideoCompressCrf(Number(event.target.value)))}
              className="crop-image-tool__range w-full"
              disabled={busy}
              aria-valuemin={VIDEO_COMPRESS_CRF_MIN}
              aria-valuemax={VIDEO_COMPRESS_CRF_MAX}
              aria-valuenow={crf}
              aria-valuetext={`CRF ${crf}`}
            />

            <div className="flex justify-between gap-2 text-xs text-neutral-500" aria-hidden>
              <span className={clsx(preset === "low" && "text-white")}>{labels.compressionLow}</span>
              <span className={clsx(preset === "medium" && "text-white")}>
                {labels.compressionMedium}
              </span>
              <span className={clsx(preset === "high" && "text-white")}>
                {labels.compressionHigh}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: labels.compressionLow, value: 20 },
                { label: labels.compressionMedium, value: 23 },
                { label: labels.compressionHigh, value: 28 },
              ].map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setCrf(entry.value)}
                  className={clsx(
                    "rounded-none border px-3 py-1.5 text-xs uppercase tracking-widest transition-colors",
                    crf === entry.value
                      ? "border-white bg-[#111] text-white"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white",
                  )}
                >
                  {entry.label} · CRF {entry.value}
                </button>
              ))}
            </div>

            <p className="text-xs leading-relaxed text-neutral-500">{labels.crfHint}</p>
          </fieldset>

          <VideoSizeCompare
            originalBytes={file.size}
            compressedBytes={result?.blob.size ?? null}
            labels={labels.sizeCompare}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                {labels.estimatedSize}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {result ? formatBytes(result.blob.size) : `~${formatBytes(estimatedBytes)}`}
              </p>
            </div>
            <div className="rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                {labels.originalBitrate}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatBitrateKbps(originalBitrate)}
              </p>
            </div>
            <div className="rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                {result ? labels.resultBitrate : labels.estimatedBitrate}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-200">
                {formatBitrateKbps(result ? resultBitrate : estimatedBitrate)}
              </p>
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
            {busy || phase === "loading" || phase === "processing" ? (
              <button type="button" className={clsx(toolPrimaryBtn, "w-full sm:w-auto")} disabled>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {labels.compressing}
              </button>
            ) : null}

            {!busy && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                onClick={() => void compressFile()}
                disabled={Boolean(blockingError)}
              >
                <Minimize2 className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.compressAndDownload}
              </button>
            ) : null}

            {!busy && phase === "success" && result ? (
              <>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => downloadVideoBlob(result.blob, result.fileName)}
                >
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                  {labels.downloadAgain}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={reset}>
                  {labels.compressAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void compressFile()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={reset}>
                  {labels.compressAnother}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
