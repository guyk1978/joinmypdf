"use client";

import { clsx } from "clsx";
import { Download, Loader2, VolumeX } from "lucide-react";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  formatMuteVideoError,
  isMp4File,
  muteVideo,
  muteVideoOutputName,
} from "@/components/tools/ffmpeg/mute-video";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const MP4_ACCEPT = "video/mp4,video/x-m4v,.mp4,.m4v";

export type VideoMuterLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  muteAndDownload: string;
  muting: string;
  statusProcessing: string;
  statusSuccess: string;
  downloadMuted: string;
  processAnother: string;
  tryAgain: string;
};

export type VideoMuterProps = {
  labels: VideoMuterLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoMuter({ labels, className, onStart, onComplete }: VideoMuterProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<undefined>({
      processor: (nextFile, _options, callbacks) => muteVideo(nextFile, callbacks),
      resolveFileName: (nextFile) => muteVideoOutputName(nextFile.name),
      formatError: formatMuteVideoError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

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
    setPickError("");
    reset();
  }, [registerFile, reset]);

  const muteAndDownload = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await process(file, undefined);
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, onStart, process, registerFile, slug]);

  const canMute = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className={clsx("video-muter-tool space-y-4", className)}>
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
            <button type="button" className={toolOutlineBtn} disabled={busy} onClick={handleReset}>
              {labels.processAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

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
                {labels.muting}
              </button>
            ) : null}

            {!busy && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canMute}
                onClick={() => void muteAndDownload()}
              >
                <VolumeX className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.muteAndDownload}
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
                  {labels.downloadMuted}
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
                  onClick={() => void muteAndDownload()}
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
