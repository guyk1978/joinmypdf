"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { VideoSizeCompare, type VideoSizeCompareLabels } from "@/components/media/VideoSizeCompare";
import {
  bootstrapMediaTools,
  getVideoManager,
  type MediaProcessingPhase,
  type MediaProgress,
  type VideoCompressionLevel,
} from "@/services/media";
import {
  clampVideoCompressionLevel,
  DEFAULT_VIDEO_COMPRESSION_LEVEL,
  downloadVideoBlob,
  isAcceptedVideoFile,
  videoCompressorOutputName,
  VIDEO_TO_MP4_ACCEPT,
} from "@/lib/video-compressor";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";

export type VideoCompressorLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  compressInstructions: string;
  qualityLabel: string;
  compressionLow: string;
  compressionMedium: string;
  compressionHigh: string;
  compressAndDownload: string;
  compressing: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  compressAnother: string;
  tryAgain: string;
  sizeCompare: VideoSizeCompareLabels;
};

export type VideoCompressorProps = {
  labels: VideoCompressorLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: (blob: Blob, filename: string, originalBytes: number, compressedBytes: number) => void;
};

function compressionLevelLabel(level: VideoCompressionLevel, labels: VideoCompressorLabels): string {
  if (level === 0) return labels.compressionLow;
  if (level === 2) return labels.compressionHigh;
  return labels.compressionMedium;
}

export function VideoCompressor({ labels, className, onStart, onComplete }: VideoCompressorProps) {
  const sliderId = useId();
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<VideoCompressionLevel>(
    DEFAULT_VIDEO_COMPRESSION_LEVEL,
  );
  const [phase, setPhase] = useState<MediaProcessingPhase>("idle");
  const [ratio, setRatio] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compressedBytes, setCompressedBytes] = useState<number | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bootstrapMediaTools();
    return () => {
      unsubRef.current?.();
    };
  }, []);

  const reset = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    registerFile(null);
    setFile(null);
    setCompressionLevel(DEFAULT_VIDEO_COMPRESSION_LEVEL);
    setPhase("idle");
    setRatio(0);
    setStatusMessage("");
    setError("");
    setBusy(false);
    setCompressedBytes(null);
  }, [registerFile]);

  const onProgress = useCallback((progress: MediaProgress) => {
    setPhase(progress.phase);
    setRatio(progress.ratio);
    if (progress.message) setStatusMessage(progress.message);
  }, []);

  const pickFile = useCallback(
    (next: File) => {
      if (!isAcceptedVideoFile(next)) {
        setError(labels.invalidFile);
        return;
      }
      setFile(next);
      setError("");
      setCompressionLevel(DEFAULT_VIDEO_COMPRESSION_LEVEL);
      setPhase("idle");
      setRatio(0);
      setStatusMessage("");
      setCompressedBytes(null);
    },
    [labels.invalidFile],
  );

  const compressFile = useCallback(async () => {
    if (!file || busy) return;

    setError("");
    setBusy(true);
    setPhase("loading");
    setRatio(0);
    setStatusMessage(labels.statusLoading);
    setCompressedBytes(null);

    onStart?.();
    const video = getVideoManager();
    unsubRef.current?.();
    unsubRef.current = video.onProgress(onProgress);

    try {
      const blob = await video.compress(file, { compressionLevel });
      const filename = videoCompressorOutputName(file);
      setCompressedBytes(blob.size);
      setPhase("success");
      setRatio(1);
      setStatusMessage(labels.statusSuccess);
      registerFile(file, slug);
      downloadVideoBlob(blob, filename);
      onComplete?.(blob, filename, file.size, blob.size);
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
  }, [busy, compressionLevel, file, labels, onComplete, onProgress, onStart, registerFile, slug]);

  const showDropzone = !file;
  const showWorkspace = Boolean(file);
  const showStatus = phase !== "idle";

  return (
    <div className={clsx("video-compressor-tool space-y-4", className)}>
      {showDropzone ? (
        <MediaDropzone
          mediaKind="video"
          accept={VIDEO_TO_MP4_ACCEPT}
          busy={busy}
          disabled={busy}
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
      ) : null}

      {showWorkspace && file ? (
        <div className="tool-workspace-panel video-compressor-tool__workspace space-y-4">
          <p className="text-sm text-neutral-300">
            <strong className="text-white">{file.name}</strong>
          </p>

          <p className="video-compressor-tool__instructions">{labels.compressInstructions}</p>

          <div className="video-compressor-tool__controls">
            <div className="video-compressor-tool__slider-row">
              <label htmlFor={sliderId} className="video-compressor-tool__slider-label">
                {labels.qualityLabel}
              </label>
              <span className="video-compressor-tool__slider-value">
                {compressionLevelLabel(compressionLevel, labels)}
              </span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={0}
              max={2}
              step={1}
              value={compressionLevel}
              onChange={(event) =>
                setCompressionLevel(clampVideoCompressionLevel(Number(event.target.value)))
              }
              className="video-compressor-tool__range crop-image-tool__range"
              disabled={busy}
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={compressionLevel}
              aria-valuetext={compressionLevelLabel(compressionLevel, labels)}
            />

            <div className="video-compressor-tool__slider-hints" aria-hidden>
              <span>{labels.compressionLow}</span>
              <span>{labels.compressionMedium}</span>
              <span>{labels.compressionHigh}</span>
            </div>
          </div>

          <VideoSizeCompare
            originalBytes={file.size}
            compressedBytes={compressedBytes}
            labels={labels.sizeCompare}
          />

          {showStatus ? (
            <MediaProcessingStatus
              phase={phase}
              ratio={ratio}
              message={
                phase === "processing"
                  ? labels.compressing
                  : statusMessage || undefined
              }
            />
          ) : null}

          <div className="video-compressor-tool__actions flex flex-wrap gap-3">
            {!busy && phase !== "success" ? (
              <button
                type="button"
                className={toolPrimaryBtn}
                onClick={() => void compressFile()}
                disabled={phase === "loading" || phase === "processing"}
              >
                {phase === "processing" || phase === "loading" ? labels.compressing : labels.compressAndDownload}
              </button>
            ) : null}

            {!busy && phase === "success" ? (
              <>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolPrimaryBtn} onClick={reset}>
                  {labels.compressAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void compressFile()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolSecondaryBtn} onClick={reset}>
                  {labels.compressAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "idle" ? (
              <button type="button" className={toolSecondaryBtn} onClick={reset}>
                {labels.compressAnother}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error && showDropzone ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
