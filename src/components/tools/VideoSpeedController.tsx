"use client";

import { clsx } from "clsx";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  changeVideoSpeed,
  changeVideoSpeedOutputName,
  formatChangeVideoSpeedError,
  MAX_SPEED,
  MIN_SPEED,
} from "@/components/tools/ffmpeg/change-video-speed";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob, isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

export type VideoSpeedControllerLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  applyAndDownload: string;
  processing: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  processAnother: string;
  tryAgain: string;
};

export type VideoSpeedControllerProps = {
  labels: VideoSpeedControllerLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

export function VideoSpeedController({
  labels,
  className,
  onStart,
  onComplete,
}: VideoSpeedControllerProps) {
  const sliderId = useId();
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [speed, setSpeed] = useState(1);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, process, reset } =
    useFfmpegVideoTool<number>({
      processor: (nextFile, factor, callbacks) => changeVideoSpeed(nextFile, factor, callbacks),
      resolveFileName: (nextFile, factor) => changeVideoSpeedOutputName(nextFile.name, factor),
      formatError: formatChangeVideoSpeedError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = blockingError || (phase === "error" ? error : undefined);

  const pickFile = useCallback(
    (next: File) => {
      if (!isAcceptedVideoFile(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setFile(next);
      setSpeed(1);
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setSpeed(1);
    reset();
    setPickError("");
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

  const showDropzone = !file;
  const showWorkspace = Boolean(file);
  const showStatus = phase !== "idle";
  const speedLabel = `${speed.toFixed(1)}×`;

  return (
    <div className={clsx("video-speed-controller-tool space-y-4", className)}>
      <FfmpegEnvironmentNotice environment={environment} error={pickError || displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {showDropzone ? (
        <MediaDropzone
          mediaKind="video"
          accept={VIDEO_TO_MP4_ACCEPT}
          busy={busy}
          disabled={busy}
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
      ) : null}

      {showWorkspace && file ? (
        <div className="tool-workspace-panel space-y-4">
          <p className="text-sm text-neutral-300">
            <strong className="text-white">{file.name}</strong>
          </p>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={sliderId} className="text-sm font-medium text-neutral-200">
                {labels.speedLabel}
              </label>
              <span className="text-sm font-semibold text-amber-200">{speedLabel}</span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={0.1}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="crop-image-tool__range w-full"
              disabled={busy}
              aria-valuemin={MIN_SPEED}
              aria-valuemax={MAX_SPEED}
              aria-valuenow={speed}
              aria-valuetext={speedLabel}
            />

            <div className="flex justify-between text-xs text-neutral-500" aria-hidden>
              <span>{labels.speedSlow}</span>
              <span>{labels.speedNormal}</span>
              <span>{labels.speedFast}</span>
            </div>
          </div>

          {showStatus ? (
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
                className={toolPrimaryBtn}
                onClick={() => void applySpeed()}
                disabled={phase === "loading" || phase === "processing"}
              >
                {phase === "processing" || phase === "loading"
                  ? labels.processing
                  : labels.applyAndDownload}
              </button>
            ) : null}

            {!busy && phase === "success" ? (
              <>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolPrimaryBtn} onClick={handleReset}>
                  {labels.processAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void applySpeed()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.processAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "idle" ? (
              <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                {labels.processAnother}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
