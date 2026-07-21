"use client";

import { clsx } from "clsx";
import { Download, Gauge, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  changeVideoSpeed,
  changeVideoSpeedOutputName,
  formatChangeVideoSpeedError,
  formatSpeedLabel,
  isMp4File,
  VIDEO_SPEED_PRESETS,
  type VideoSpeedPreset,
} from "@/components/tools/ffmpeg/change-video-speed";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP4_ACCEPT = "video/mp4,video/x-m4v,.mp4,.m4v";

export type VideoSpeedLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  reencodeNotice: string;
  speedLabel: string;
  applyAndDownload: string;
  processing: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  downloadResult: string;
  processAnother: string;
  tryAgain: string;
};

export type VideoSpeedProps = {
  labels: VideoSpeedLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoSpeed({ labels, className, onStart, onComplete }: VideoSpeedProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [speed, setSpeed] = useState<VideoSpeedPreset>(2);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<number>({
      processor: (nextFile, factor, callbacks) => changeVideoSpeed(nextFile, factor, callbacks),
      resolveFileName: (nextFile, factor) => changeVideoSpeedOutputName(nextFile.name, factor),
      formatError: formatChangeVideoSpeedError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);
  const isProcessing = busy || phase === "loading" || phase === "processing";

  const pickFile = useCallback(
    (next: File) => {
      if (!isMp4File(next)) {
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
    setSpeed(2);
    setPickError("");
    reset();
  }, [registerFile, reset]);

  const applySpeed = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await process(file, speed);
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, onStart, process, registerFile, slug, speed]);

  const canApply = Boolean(file) && !isProcessing && environment?.canRun !== false;

  return (
    <div className={clsx("video-speed-tool space-y-4", className)}>
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
              {labels.processAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>
          <p className="rounded-none border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
            {labels.reencodeNotice}
          </p>

          <fieldset disabled={isProcessing} className="space-y-3 border-0 p-0">
            <legend className="mb-2 text-sm font-medium text-neutral-200">{labels.speedLabel}</legend>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-5"
              role="radiogroup"
              aria-label={labels.speedLabel}
            >
              {VIDEO_SPEED_PRESETS.map((preset) => {
                const selected = speed === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={clsx(
                      "rounded-none border px-3 py-3 text-sm font-semibold transition-colors",
                      selected
                        ? "border-white bg-white text-black"
                        : "border-neutral-700 bg-[#111] text-neutral-200 hover:border-neutral-500 hover:text-white",
                      isProcessing && "cursor-not-allowed opacity-60",
                    )}
                    onClick={() => {
                      setSpeed(preset);
                      if (phase === "success" || phase === "error") reset();
                    }}
                  >
                    {formatSpeedLabel(preset)}
                  </button>
                );
              })}
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
                    ? labels.statusProcessing.replace("{speed}", formatSpeedLabel(speed))
                    : phase === "success"
                      ? labels.statusSuccess.replace("{size}", formatBytes(result?.blob.size ?? 0))
                      : statusMessage || undefined
              }
              className={clsx(isProcessing && "ring-1 ring-amber-700/50")}
            />
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isProcessing ? (
              <button type="button" className={clsx(toolPrimaryBtn, "w-full sm:w-auto")} disabled>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {labels.processing}
              </button>
            ) : null}

            {!isProcessing && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canApply}
                onClick={() => void applySpeed()}
              >
                <Gauge className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.applyAndDownload}
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
                  {labels.downloadResult}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.processAnother}
                </button>
              </>
            ) : null}

            {!isProcessing && phase === "error" ? (
              <>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => void applySpeed()}
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
