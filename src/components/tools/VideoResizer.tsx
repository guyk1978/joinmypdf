"use client";

import { clsx } from "clsx";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  resizeVideo,
  resizeVideoOutputName,
  formatResizeVideoError,
  VIDEO_RESOLUTIONS,
  type VideoResolution,
} from "@/components/tools/ffmpeg/resize-video";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob, isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

export type VideoResizerLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  resolutionLabel: string;
  resolution480: string;
  resolution720: string;
  resolution1080: string;
  resizeAndDownload: string;
  resizing: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  resizeAnother: string;
  tryAgain: string;
};

export type VideoResizerProps = {
  labels: VideoResizerLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function resolutionLabel(height: VideoResolution, labels: VideoResizerLabels): string {
  if (height === 480) return labels.resolution480;
  if (height === 1080) return labels.resolution1080;
  return labels.resolution720;
}

export function VideoResizer({ labels, className, onStart, onComplete }: VideoResizerProps) {
  const selectId = useId();
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [height, setHeight] = useState<VideoResolution>(720);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, process, reset } =
    useFfmpegVideoTool<VideoResolution>({
      processor: (nextFile, resolution, callbacks) =>
        resizeVideo(nextFile, resolution, callbacks),
      resolveFileName: (nextFile, resolution) => resizeVideoOutputName(nextFile.name, resolution),
      formatError: formatResizeVideoError,
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
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setHeight(720);
    reset();
    setPickError("");
  }, [registerFile, reset]);

  const resizeFile = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await process(file, height);
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, height, onStart, process, registerFile, slug]);

  const showDropzone = !file;
  const showWorkspace = Boolean(file);
  const showStatus = phase !== "idle";

  return (
    <div className={clsx("video-resizer-tool space-y-4", className)}>
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
            <label htmlFor={selectId} className="text-sm font-medium text-neutral-200">
              {labels.resolutionLabel}
            </label>
            <select
              id={selectId}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value) as VideoResolution)}
              disabled={busy}
              className="w-full rounded-none border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              {VIDEO_RESOLUTIONS.map((value) => (
                <option key={value} value={value}>
                  {resolutionLabel(value, labels)}
                </option>
              ))}
            </select>
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
                onClick={() => void resizeFile()}
                disabled={phase === "loading" || phase === "processing"}
              >
                {phase === "processing" || phase === "loading"
                  ? labels.resizing
                  : labels.resizeAndDownload}
              </button>
            ) : null}

            {!busy && phase === "success" ? (
              <>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolPrimaryBtn} onClick={handleReset}>
                  {labels.resizeAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "error" ? (
              <>
                <button type="button" className={toolPrimaryBtn} onClick={() => void resizeFile()}>
                  {labels.tryAgain}
                </button>
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                  {labels.resizeAnother}
                </button>
              </>
            ) : null}

            {!busy && phase === "idle" ? (
              <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                {labels.resizeAnother}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
