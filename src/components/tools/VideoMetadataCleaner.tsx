"use client";

import { clsx } from "clsx";
import { Download, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  probeVideoContainerMetadata,
  type VideoMetadataPreview,
} from "@/components/tools/ffmpeg/probe-video-metadata";
import {
  formatStripVideoMetadataError,
  isVideoMetadataCleanerInput,
  stripVideoMetadata,
  stripVideoMetadataOutputName,
} from "@/components/tools/ffmpeg/strip-video-metadata";
import { useFfmpegVideoTool } from "@/components/tools/hooks/useFfmpegVideoTool";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { downloadVideoBlob } from "@/lib/video-to-mp4";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/x-m4v,.mp4,.m4v,.mov";

export type VideoMetadataCleanerLabels = {
  dropTitle: string;
  dropTitleBusy: string;
  dropDescription: string;
  privacyBadge: string;
  formatsHint: string;
  selectLabel: string;
  invalidFile: string;
  instructions: string;
  previewTitle: string;
  previewEmpty: string;
  previewScanning: string;
  sensitiveBadge: string;
  cleanAndDownload: string;
  cleaning: string;
  statusProcessing: string;
  statusSuccess: string;
  summaryTitle: string;
  summaryBody: string;
  summaryFieldsRemoved: string;
  downloadCleaned: string;
  processAnother: string;
  tryAgain: string;
};

export type VideoMetadataCleanerProps = {
  labels: VideoMetadataCleanerLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoMetadataCleaner({
  labels,
  className,
  onStart,
  onComplete,
}: VideoMetadataCleanerProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState("");
  const [preview, setPreview] = useState<VideoMetadataPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<undefined>({
      processor: (nextFile, _options, callbacks) => stripVideoMetadata(nextFile, callbacks),
      resolveFileName: (nextFile) => stripVideoMetadataOutputName(nextFile.name),
      formatError: formatStripVideoMetadataError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError = pickError || blockingError || (phase === "error" ? error : undefined);
  const isProcessing = busy || phase === "loading" || phase === "processing";

  const pickFile = useCallback(
    async (next: File) => {
      if (!isVideoMetadataCleanerInput(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setFile(next);
      setRemovedCount(0);
      reset();
      setPreview(null);
      setPreviewLoading(true);
      try {
        const scanned = await probeVideoContainerMetadata(next);
        setPreview(scanned);
      } catch {
        setPreview({
          fields: [],
          hasGps: false,
          hasDeviceInfo: false,
          hasTimestamps: false,
          scannedBytes: 0,
        });
      } finally {
        setPreviewLoading(false);
      }
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setPickError("");
    setPreview(null);
    setRemovedCount(0);
    reset();
  }, [registerFile, reset]);

  const cleanAndDownload = useCallback(async () => {
    if (!file || busy) return;
    onStart?.();
    const count = preview?.fields.length ?? 0;
    const payload = await process(file, undefined);
    if (payload) {
      setRemovedCount(count);
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [busy, file, onStart, preview?.fields.length, process, registerFile, slug]);

  const canClean = Boolean(file) && !isProcessing && environment?.canRun !== false;

  return (
    <div className={clsx("video-metadata-cleaner-tool space-y-4", className)}>
      <FfmpegEnvironmentNotice environment={environment} error={displayError} />

      {environment && !blockingError && environment.performanceNotice ? (
        <FfmpegEnvironmentNotice environment={environment} />
      ) : null}

      {!file ? (
        <MediaDropzone
          mediaKind="video"
          accept={VIDEO_ACCEPT}
          busy={busy}
          disabled={busy || Boolean(blockingError)}
          supportedFormats={["MP4", "MOV"]}
          onFile={(next) => void pickFile(next)}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
                aria-hidden
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="text-neutral-200">
                  <strong className="text-white">{file.name}</strong>
                  {" · "}
                  {formatBytes(file.size)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {labels.privacyBadge}
                </p>
              </div>
            </div>
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

          <section
            className="space-y-3 rounded-none border border-neutral-800 bg-[#111] p-4"
            aria-labelledby="metadata-preview-heading"
          >
            <h2
              id="metadata-preview-heading"
              className="m-0 text-sm font-semibold uppercase tracking-widest text-neutral-300"
            >
              {labels.previewTitle}
            </h2>

            {previewLoading ? (
              <p className="m-0 flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {labels.previewScanning}
              </p>
            ) : null}

            {!previewLoading && preview && preview.fields.length === 0 ? (
              <p className="m-0 text-sm text-neutral-400">{labels.previewEmpty}</p>
            ) : null}

            {!previewLoading && preview && preview.fields.length > 0 ? (
              <ul className="m-0 list-none space-y-2 p-0">
                {preview.fields.map((field) => (
                  <li
                    key={field.key}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-800 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <span className="text-neutral-400">
                      {field.label}
                      {field.sensitive ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-400">
                          {labels.sensitiveBadge}
                        </span>
                      ) : null}
                    </span>
                    <span className="max-w-full break-all font-medium text-neutral-100">
                      {field.value}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {isProcessing || phase === "success" || phase === "error" ? (
            <MediaProcessingStatus
              phase={isProcessing ? (phase === "loading" ? "loading" : "processing") : phase}
              ratio={ratio}
              message={
                phase === "processing"
                  ? labels.statusProcessing
                  : phase === "success"
                    ? labels.statusSuccess.replace("{size}", formatBytes(result?.blob.size ?? 0))
                    : statusMessage || undefined
              }
            />
          ) : null}

          {phase === "success" && result ? (
            <section
              className="space-y-2 rounded-none border border-emerald-900/50 bg-emerald-950/20 p-4"
              aria-labelledby="metadata-removed-heading"
            >
              <h2
                id="metadata-removed-heading"
                className="m-0 flex items-center gap-2 text-sm font-semibold text-emerald-300"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {labels.summaryTitle}
              </h2>
              <p className="m-0 text-sm text-emerald-100/90">{labels.summaryBody}</p>
              <p className="m-0 text-xs uppercase tracking-widest text-emerald-400/80">
                {labels.summaryFieldsRemoved.replace("{count}", String(removedCount))}
              </p>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isProcessing ? (
              <button type="button" className={clsx(toolPrimaryBtn, "w-full sm:w-auto")} disabled>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                {labels.cleaning}
              </button>
            ) : null}

            {!isProcessing && phase !== "success" && phase !== "error" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canClean}
                onClick={() => void cleanAndDownload()}
              >
                <Lock className="mr-2 inline h-4 w-4" aria-hidden />
                {labels.cleanAndDownload}
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
                  {labels.downloadCleaned}
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
                  onClick={() => void cleanAndDownload()}
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
