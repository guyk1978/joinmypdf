"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  convertVideoToGif,
  formatVideoToGifError,
  videoToGifOutputName,
} from "@/components/tools/ffmpeg/video-to-gif";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

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
  createGif: string;
  creating: string;
  statusLoading: string;
  statusProcessing: string;
  statusSuccess: string;
  statusError: string;
  convertAnother: string;
  tryAgain: string;
};

export type VideoToGifProps = {
  labels: VideoToGifLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function downloadGifBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function VideoToGif({ labels, className, onStart, onComplete }: VideoToGifProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, process, reset } =
    useFfmpegVideoTool<undefined>({
      processor: (nextFile, _options, callbacks) => convertVideoToGif(nextFile, callbacks),
      resolveFileName: (nextFile) => videoToGifOutputName(nextFile.name),
      formatError: formatVideoToGifError,
      onComplete: () => onComplete?.(),
    });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    reset();
    setPickError("");
  }, [registerFile, reset]);

  const createGif = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await process(file, undefined);
    if (payload) {
      registerFile(file, slug);
      downloadGifBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, onStart, process, registerFile, slug]);

  const showDropzone = !file;
  const showWorkspace = Boolean(file);
  const showStatus = phase !== "idle";

  return (
    <div className={clsx("video-to-gif-tool space-y-4", className)}>
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

          {previewUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-200">{labels.previewLabel}</p>
              <div className="overflow-hidden rounded-none border border-neutral-800 bg-neutral-950">
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="max-h-64 w-full bg-black object-contain"
                />
              </div>
            </div>
          ) : null}

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
                onClick={() => void createGif()}
                disabled={phase === "loading" || phase === "processing"}
              >
                {phase === "processing" || phase === "loading"
                  ? labels.creating
                  : labels.createGif}
              </button>
            ) : null}

            {!busy && phase === "success" ? (
              <>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolPrimaryBtn} onClick={handleReset}>
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

            {!busy && phase === "idle" ? (
              <button type="button" className={toolOutlineBtn} onClick={handleReset}>
                {labels.convertAnother}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
