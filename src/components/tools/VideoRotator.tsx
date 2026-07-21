"use client";

import { clsx } from "clsx";
import { Download, Loader2, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  cssRotateDegrees,
  formatRotateVideoError,
  isMp4File,
  rotateVideo,
  rotateVideoOutputName,
  VIDEO_ROTATION_ANGLES,
  type VideoRotateMethod,
  type VideoRotationAngle,
} from "@/components/tools/ffmpeg/rotate-video";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP4_ACCEPT = "video/mp4,video/x-m4v,.mp4,.m4v";

export type VideoRotatorLabels = {
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
  rotationLabel: string;
  rotate90: string;
  rotate180: string;
  rotate270: string;
  methodLabel: string;
  methodMetadata: string;
  methodMetadataHint: string;
  methodReencode: string;
  methodReencodeHint: string;
  rotateAndDownload: string;
  rotating: string;
  statusLoading: string;
  statusProcessingMetadata: string;
  statusProcessingReencode: string;
  statusSuccess: string;
  statusSuccessFallback: string;
  downloadRotated: string;
  rotateAnother: string;
  tryAgain: string;
};

export type VideoRotatorProps = {
  labels: VideoRotatorLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

type RotateToolOptions = {
  angle: VideoRotationAngle;
  method: VideoRotateMethod;
};

function angleLabel(angle: VideoRotationAngle, labels: VideoRotatorLabels): string {
  if (angle === 90) return labels.rotate90;
  if (angle === 180) return labels.rotate180;
  return labels.rotate270;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoRotator({ labels, className, onStart, onComplete }: VideoRotatorProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [angle, setAngle] = useState<VideoRotationAngle>(90);
  const [method, setMethod] = useState<VideoRotateMethod>("metadata");
  const [methodUsed, setMethodUsed] = useState<VideoRotateMethod | null>(null);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<RotateToolOptions>({
      processor: async (nextFile, options, callbacks) => {
        const outcome = await rotateVideo(nextFile, options.angle, {
          ...callbacks,
          method: options.method,
        });
        setMethodUsed(outcome.methodUsed);
        return outcome.blob;
      },
      resolveFileName: (nextFile, options) => rotateVideoOutputName(nextFile.name, options.angle),
      formatError: formatRotateVideoError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);
  const isProcessing = busy || phase === "loading" || phase === "processing";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  useEffect(() => {
    if (phase === "success" && result) {
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(result.blob);
      });
    }
  }, [phase, result]);

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp4File(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setFile(next);
      setAngle(90);
      setMethod("metadata");
      setMethodUsed(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(next);
      });
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setAngle(90);
    setMethod("metadata");
    setMethodUsed(null);
    setPickError("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    reset();
  }, [registerFile, reset]);

  const rotateFile = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    setMethodUsed(null);
    const payload = await process(file, { angle, method });
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [angle, busy, file, method, onStart, process, registerFile, slug]);

  const canRotate = Boolean(file) && !isProcessing && environment?.canRun !== false;
  const previewDegrees = cssRotateDegrees(angle);

  return (
    <div className={clsx("video-rotator-tool space-y-4", className)}>
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
            </p>
            <button
              type="button"
              className={toolOutlineBtn}
              disabled={isProcessing}
              onClick={handleReset}
            >
              {labels.rotateAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          {previewUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-200">{labels.previewLabel}</p>
              <div className="flex min-h-[200px] items-center justify-center overflow-hidden border border-neutral-800 bg-black">
                <video
                  key={previewUrl}
                  src={previewUrl}
                  controls
                  playsInline
                  className="max-h-[320px] max-w-full transition-transform duration-300"
                  style={{ transform: `rotate(${previewDegrees}deg)` }}
                />
              </div>
            </div>
          ) : null}

          <fieldset disabled={isProcessing} className="space-y-2 border-0 p-0">
            <legend className="mb-2 text-sm font-medium text-neutral-200">
              {labels.rotationLabel}
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label={labels.rotationLabel}>
              {VIDEO_ROTATION_ANGLES.map((value) => {
                const active = angle === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setAngle(value);
                      if (phase === "success" || phase === "error") {
                        setMethodUsed(null);
                        setResultUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                        reset();
                      }
                    }}
                    className={clsx(
                      "rounded-none border px-4 py-3 text-sm font-semibold transition-colors",
                      active
                        ? "border-white bg-white text-black"
                        : "border-neutral-700 bg-[#111] text-neutral-200 hover:border-neutral-500 hover:text-white",
                    )}
                  >
                    {angleLabel(value, labels)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset disabled={isProcessing} className="space-y-2 border-0 p-0">
            <legend className="mb-2 text-sm font-medium text-neutral-200">{labels.methodLabel}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={method === "metadata"}
                onClick={() => setMethod("metadata")}
                className={clsx(
                  "rounded-none border px-3 py-3 text-left transition-colors",
                  method === "metadata"
                    ? "border-amber-500/60 bg-amber-950/30 text-amber-100"
                    : "border-neutral-700 bg-[#111] text-neutral-300 hover:border-neutral-500",
                )}
              >
                <span className="block text-sm font-semibold">{labels.methodMetadata}</span>
                <span className="mt-1 block text-xs leading-relaxed text-neutral-400">
                  {labels.methodMetadataHint}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={method === "reencode"}
                onClick={() => setMethod("reencode")}
                className={clsx(
                  "rounded-none border px-3 py-3 text-left transition-colors",
                  method === "reencode"
                    ? "border-amber-500/60 bg-amber-950/30 text-amber-100"
                    : "border-neutral-700 bg-[#111] text-neutral-300 hover:border-neutral-500",
                )}
              >
                <span className="block text-sm font-semibold">{labels.methodReencode}</span>
                <span className="mt-1 block text-xs leading-relaxed text-neutral-400">
                  {labels.methodReencodeHint}
                </span>
              </button>
            </div>
          </fieldset>

          {isProcessing || phase === "success" || phase === "error" ? (
            <MediaProcessingStatus
              phase={isProcessing ? (phase === "loading" ? "loading" : "processing") : phase}
              ratio={ratio}
              message={
                phase === "loading"
                  ? labels.statusLoading
                  : phase === "processing"
                    ? method === "metadata"
                      ? labels.statusProcessingMetadata
                      : labels.statusProcessingReencode
                    : phase === "success"
                      ? methodUsed === "reencode" && method === "metadata"
                        ? labels.statusSuccessFallback.replace(
                            "{size}",
                            formatBytes(result?.blob.size ?? 0),
                          )
                        : labels.statusSuccess.replace("{size}", formatBytes(result?.blob.size ?? 0))
                      : statusMessage || undefined
              }
            />
          ) : null}

          {phase === "success" && resultUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-200">{labels.resultPreviewLabel}</p>
              <div className="flex min-h-[160px] items-center justify-center overflow-hidden border border-neutral-800 bg-black">
                <video
                  key={resultUrl}
                  src={resultUrl}
                  controls
                  playsInline
                  className="max-h-[280px] max-w-full"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isProcessing ? (
              <button type="button" className={clsx(toolPrimaryBtn, "w-full sm:w-auto")} disabled>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {labels.rotating}
              </button>
            ) : null}

            {!isProcessing && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canRotate}
                onClick={() => void rotateFile()}
              >
                <RotateCw className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.rotateAndDownload}
              </button>
            ) : null}

            {!isProcessing && phase === "success" && result ? (
              <>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => downloadVideoBlob(result.blob, result.fileName)}
                >
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                  {labels.downloadRotated}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.rotateAnother}
                </button>
              </>
            ) : null}

            {!isProcessing && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void rotateFile()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.rotateAnother}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
