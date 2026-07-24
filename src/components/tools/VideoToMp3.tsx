"use client";

import { clsx } from "clsx";
import { Download, Loader2, Music } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  isVideoToMp3Input,
  VIDEO_TO_MP3_QUALITY_OPTIONS,
  type VideoToMp3Quality,
} from "@/components/tools/ffmpeg/convert-video-to-mp3";
import {
  useFfmpegVideoToMp3,
  type FfmpegVideoToMp3Result,
} from "@/components/tools/hooks/useFfmpegVideoToMp3";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export type VideoToMp3Labels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  qualityLabel: string;
  qualityHint: string;
  qualityVbr: string;
  quality128: string;
  quality192: string;
  quality320: string;
  extractAndDownload: string;
  extracting: string;
  statusProcessing: string;
  statusSuccess: string;
  downloadMp3: string;
  convertAnother: string;
  tryAgain: string;
};

export type VideoToMp3Props = {
  labels: VideoToMp3Labels;
  className?: string;
  onStart?: () => void;
  onComplete?: (result: FfmpegVideoToMp3Result) => void;
};

function qualityOptionLabel(quality: VideoToMp3Quality, labels: VideoToMp3Labels): string {
  if (quality === "vbr2") return labels.qualityVbr;
  if (quality === 128) return labels.quality128;
  if (quality === 192) return labels.quality192;
  return labels.quality320;
}

export function VideoToMp3({ labels, className, onStart, onComplete }: VideoToMp3Props) {
  const qualityId = useId();
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<VideoToMp3Quality>("vbr2");
  const [pickError, setPickError] = useState("");

  const { environment, phase, ratio, statusMessage, error, busy, result, convert, reset } =
    useFfmpegVideoToMp3({
      onComplete: (payload) => {
        onComplete?.(payload);
      },
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);

  const pickFile = useCallback(
    (next: File) => {
      if (!isVideoToMp3Input(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setFile(next);
      setPickError("");
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setPickError("");
    setQuality("vbr2");
    reset();
  }, [registerFile, reset]);

  const extractAndDownload = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const payload = await convert(file, quality);
    if (payload) {
      registerFile(file, slug);
      downloadBlob(payload.blob, payload.fileName);
    }
  }, [busy, convert, file, onStart, quality, registerFile, slug]);

  const canConvert = Boolean(file) && !busy && environment?.canRun !== false;

  return (
    <div className={clsx("video-to-mp3-tool mt-6 space-y-4", className)}>
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
          supportedFormats={["MP4", "MOV", "WEBM", "MKV", "AVI"]}
          showPrivacy={false}
          onFile={pickFile}
          onError={(message) => setPickError(message)}
          labels={{
            title: labels.dropTitle,
            titleBusy: labels.dropTitleBusy,
            description: labels.dropDescription,
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
              {labels.convertAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-4">
            <label htmlFor={qualityId} className="text-sm font-medium text-neutral-200">
              {labels.qualityLabel}
            </label>
            <select
              id={qualityId}
              value={String(quality)}
              disabled={busy}
              onChange={(event) => {
                const value = event.target.value;
                setQuality(value === "vbr2" ? "vbr2" : (Number(value) as 128 | 192 | 320));
              }}
              className="w-full px-3 py-2 text-sm text-white"
            >
              {VIDEO_TO_MP3_QUALITY_OPTIONS.map((option) => (
                <option key={String(option)} value={String(option)}>
                  {qualityOptionLabel(option, labels)}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">{labels.qualityHint}</p>
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
                {labels.extracting}
              </button>
            ) : null}

            {!busy && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canConvert}
                onClick={() => void extractAndDownload()}
              >
                <Music className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.extractAndDownload}
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
                  onClick={() => downloadBlob(result.blob, result.fileName)}
                >
                  <Download className="mr-2 inline h-4 w-4" aria-hidden />
                  {labels.downloadMp3}
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
                  onClick={() => void extractAndDownload()}
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
