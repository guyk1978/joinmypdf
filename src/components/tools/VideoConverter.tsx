"use client";

import { clsx } from "clsx";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  convertVideoFormat,
  formatConvertVideoError,
  isVideoConverterInput,
  VIDEO_CONVERT_TARGET_FORMATS,
  videoConvertOutputName,
  type VideoConvertTargetFormat,
} from "@/components/tools/ffmpeg/convert-video-format";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

export type VideoConverterLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  targetFormatLabel: string;
  targetFormatHint: string;
  formatMp4: string;
  formatWebm: string;
  formatMov: string;
  convertAndDownload: string;
  converting: string;
  statusProcessing: string;
  statusSuccess: string;
  downloadConverted: string;
  convertAnother: string;
  tryAgain: string;
};

export type VideoConverterProps = {
  labels: VideoConverterLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatOptionLabel(
  format: VideoConvertTargetFormat,
  labels: VideoConverterLabels,
): string {
  if (format === "mp4") return labels.formatMp4;
  if (format === "webm") return labels.formatWebm;
  return labels.formatMov;
}

export function VideoConverter({ labels, className, onStart, onComplete }: VideoConverterProps) {
  const formatId = useId();
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<VideoConvertTargetFormat>("mp4");
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<{ targetFormat: VideoConvertTargetFormat }>({
      processor: (nextFile, options, callbacks) =>
        convertVideoFormat(nextFile, { ...options, ...callbacks }),
      resolveFileName: (nextFile, options) =>
        videoConvertOutputName(nextFile.name, options.targetFormat),
      formatError: formatConvertVideoError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const pickFile = useCallback(
    (next: File) => {
      if (!isVideoConverterInput(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setFile(next);
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setPickError("");
    setTargetFormat("mp4");
    reset();
  }, [registerFile, reset]);

  const convertAndDownload = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await process(file, { targetFormat });
    if (payload) {
      registerFile(file, slug, targetFormat.toUpperCase());
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, onStart, process, registerFile, slug, targetFormat]);

  const canConvert = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className={clsx("video-converter-tool space-y-4", className)}>
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
          supportedFormats={["MOV", "MKV", "AVI", "WMV", "MP4", "WEBM"]}
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
        <div className="tool-workspace-panel space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-neutral-200">
              <strong className="text-white">{file.name}</strong>
              {" · "}
              {formatBytes(file.size)}
            </p>
            <button type="button" className={toolOutlineBtn} disabled={busy} onClick={handleReset}>
              {labels.convertAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-4">
            <label htmlFor={formatId} className="text-sm font-medium text-neutral-200">
              {labels.targetFormatLabel}
            </label>
            <select
              id={formatId}
              value={targetFormat}
              disabled={busy}
              onChange={(event) => {
                setTargetFormat(event.target.value as VideoConvertTargetFormat);
                reset();
              }}
              className="w-full rounded-none border border-neutral-700 bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              {VIDEO_CONVERT_TARGET_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {formatOptionLabel(format, labels)}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">{labels.targetFormatHint}</p>
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
                {labels.converting}
              </button>
            ) : null}

            {!busy && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canConvert}
                onClick={() => void convertAndDownload()}
              >
                <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.convertAndDownload}
              </button>
            ) : null}

            {!busy && phase === "success" && result ? (
              <>
                <p className="w-full text-sm text-emerald-400">
                  {labels.statusSuccess.replace("{size}", formatBytes(result.blob.size))}
                </p>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => downloadVideoBlob(result.blob, result.fileName)}
                >
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                  {labels.downloadConverted}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.convertAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => void convertAndDownload()}
                >
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
