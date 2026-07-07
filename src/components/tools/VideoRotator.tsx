"use client";

import { clsx } from "clsx";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  formatRotateVideoError,
  rotateVideo,
  rotateVideoOutputName,
  VIDEO_ROTATION_ANGLES,
  type VideoRotationAngle,
} from "@/components/tools/ffmpeg/rotate-video";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob, isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

export type VideoRotatorLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  rotationLabel: string;
  rotate90: string;
  rotate180: string;
  rotate270: string;
  rotateAndDownload: string;
  rotating: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  rotateAnother: string;
  tryAgain: string;
};

export type VideoRotatorProps = {
  labels: VideoRotatorLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function angleLabel(angle: VideoRotationAngle, labels: VideoRotatorLabels): string {
  if (angle === 90) return labels.rotate90;
  if (angle === 180) return labels.rotate180;
  return labels.rotate270;
}

export function VideoRotator({ labels, className, onStart, onComplete }: VideoRotatorProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<VideoRotationAngle>(90);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, process, reset } =
    useFfmpegVideoTool<VideoRotationAngle>({
      processor: (nextFile, rotation, callbacks) => rotateVideo(nextFile, rotation, callbacks),
      resolveFileName: (nextFile, rotation) => rotateVideoOutputName(nextFile.name, rotation),
      formatError: formatRotateVideoError,
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
      setAngle(90);
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setAngle(90);
    reset();
    setPickError("");
  }, [registerFile, reset]);

  const rotateFile = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await process(file, angle);
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [angle, busy, file, onStart, process, registerFile, slug]);

  const showDropzone = !file;
  const showWorkspace = Boolean(file);
  const showStatus = phase !== "idle";

  return (
    <div className={clsx("video-rotator-tool space-y-4", className)}>
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
        <div className="tool-workspace-panel space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a] p-4">
          <p className="text-sm text-neutral-300">
            <strong className="text-white">{file.name}</strong>
          </p>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-200">{labels.rotationLabel}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={labels.rotationLabel}>
              {VIDEO_ROTATION_ANGLES.map((value) => {
                const active = angle === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={busy}
                    aria-pressed={active}
                    onClick={() => setAngle(value)}
                    className={clsx(
                      "rounded-none border px-4 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                        : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500",
                    )}
                  >
                    {angleLabel(value, labels)}
                  </button>
                );
              })}
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
                onClick={() => void rotateFile()}
                disabled={phase === "loading" || phase === "processing"}
              >
                {phase === "processing" || phase === "loading"
                  ? labels.rotating
                  : labels.rotateAndDownload}
              </button>
            ) : null}

            {!busy && phase === "success" ? (
              <>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolPrimaryBtn} onClick={handleReset}>
                  {labels.rotateAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void rotateFile()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.rotateAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "idle" ? (
              <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                {labels.rotateAnother}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
