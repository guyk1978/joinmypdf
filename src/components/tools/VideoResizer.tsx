"use client";

import { clsx } from "clsx";
import { Download, Loader2, Maximize2, Ratio, Smartphone, Square } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MediaDropzone } from "@/components/media/MediaDropzone";
import { MediaProcessingStatus } from "@/components/media/MediaProcessingStatus";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { FfmpegEnvironmentNotice } from "@/components/tools/FfmpegEnvironmentNotice";
import {
  ASPECT_RATIO_PRESETS,
  computeCenterCrop,
  evenFloor,
  formatResizeVideoError,
  isValidResizeDimensions,
  resizeVideo,
  resizeVideoOutputName,
  type AspectRatioPresetId,
  type ResizeVideoOptions,
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
  presetsLabel: string;
  preset916: string;
  preset11: string;
  preset169: string;
  customLabel: string;
  widthLabel: string;
  heightLabel: string;
  sourceSizeLabel: string;
  cropPreviewLabel: string;
  cropPreviewHint: string;
  outputSizeLabel: string;
  resizeAndDownload: string;
  resizing: string;
  statusProcessing: string;
  statusSuccess: string;
  resizeAnother: string;
  tryAgain: string;
  downloadAgain: string;
  dimensionsError: string;
};

export type VideoResizerProps = {
  labels: VideoResizerLabels;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const PRESET_ICONS = {
  "9:16": Smartphone,
  "1:1": Square,
  "16:9": Ratio,
} as const;

export function VideoResizer({ labels, className, onStart, onComplete }: VideoResizerProps) {
  const widthId = useId();
  const heightId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [presetId, setPresetId] = useState<AspectRatioPresetId>("9:16");
  const [outputWidth, setOutputWidth] = useState(1080);
  const [outputHeight, setOutputHeight] = useState(1920);
  const [pickError, setPickError] = useState("");
  const [dimensionsError, setDimensionsError] = useState("");
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  const { environment, phase, ratio, statusMessage, error, busy, result, process, reset } =
    useFfmpegVideoTool<ResizeVideoOptions>({
      processor: (nextFile, options, callbacks) => resizeVideo(nextFile, options, callbacks),
      resolveFileName: (nextFile, options) =>
        resizeVideoOutputName(nextFile.name, options.outputWidth, options.outputHeight),
      formatError: formatResizeVideoError,
      onComplete: () => onComplete?.(),
    });

  const blockingError =
    environment && !environment.canRun ? environment.blockingMessage : undefined;
  const displayError =
    dimensionsError || pickError || blockingError || (phase === "error" ? error : undefined);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setSourceWidth(0);
      setSourceHeight(0);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const update = () => {
      setFrameSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewUrl, file]);

  const cropRect = useMemo(() => {
    if (sourceWidth < 2 || sourceHeight < 2 || outputWidth < 2 || outputHeight < 2) {
      return null;
    }
    return computeCenterCrop(sourceWidth, sourceHeight, outputWidth, outputHeight);
  }, [outputHeight, outputWidth, sourceHeight, sourceWidth]);

  const cropOverlayStyle = useMemo(() => {
    if (!cropRect || sourceWidth < 2 || sourceHeight < 2 || frameSize.width < 2) {
      return null;
    }

    const videoAspect = sourceWidth / sourceHeight;
    const frameAspect = frameSize.width / frameSize.height;

    let displayW: number;
    let displayH: number;
    let offsetX: number;
    let offsetY: number;

    if (frameAspect > videoAspect) {
      displayH = frameSize.height;
      displayW = frameSize.height * videoAspect;
      offsetX = (frameSize.width - displayW) / 2;
      offsetY = 0;
    } else {
      displayW = frameSize.width;
      displayH = frameSize.width / videoAspect;
      offsetX = 0;
      offsetY = (frameSize.height - displayH) / 2;
    }

    const scaleX = displayW / sourceWidth;
    const scaleY = displayH / sourceHeight;

    return {
      left: offsetX + cropRect.x * scaleX,
      top: offsetY + cropRect.y * scaleY,
      width: cropRect.width * scaleX,
      height: cropRect.height * scaleY,
    };
  }, [cropRect, frameSize.height, frameSize.width, sourceHeight, sourceWidth]);

  const onVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    setSourceWidth(video.videoWidth);
    setSourceHeight(video.videoHeight);
    setDimensionsError("");
  }, []);

  const applyPreset = useCallback((id: AspectRatioPresetId) => {
    setPresetId(id);
    setDimensionsError("");
    if (id === "custom") return;
    const preset = ASPECT_RATIO_PRESETS.find((entry) => entry.id === id);
    if (!preset) return;
    setOutputWidth(preset.width);
    setOutputHeight(preset.height);
  }, []);

  const pickFile = useCallback(
    (next: File) => {
      if (!isAcceptedVideoFile(next)) {
        setPickError(labels.invalidFile);
        return;
      }
      setPickError("");
      setDimensionsError("");
      setFile(next);
      setPresetId("9:16");
      setOutputWidth(1080);
      setOutputHeight(1920);
      reset();
    },
    [labels.invalidFile, reset],
  );

  const handleReset = useCallback(() => {
    registerFile(null);
    setFile(null);
    setPickError("");
    setDimensionsError("");
    setPresetId("9:16");
    setOutputWidth(1080);
    setOutputHeight(1920);
    setSourceWidth(0);
    setSourceHeight(0);
    reset();
  }, [registerFile, reset]);

  const resizeFile = useCallback(async () => {
    if (!file || busy) return;

    const width = evenFloor(outputWidth);
    const height = evenFloor(outputHeight);

    if (!isValidResizeDimensions(width, height) || sourceWidth < 2 || sourceHeight < 2) {
      setDimensionsError(labels.dimensionsError);
      return;
    }

    setDimensionsError("");
    onStart?.();

    const options: ResizeVideoOptions = {
      sourceWidth,
      sourceHeight,
      outputWidth: width,
      outputHeight: height,
    };

    const payload = await process(file, options);
    if (payload) {
      registerFile(file, slug);
      downloadVideoBlob(payload.blob, payload.fileName);
    }
  }, [
    busy,
    file,
    labels.dimensionsError,
    onStart,
    outputHeight,
    outputWidth,
    process,
    registerFile,
    slug,
    sourceHeight,
    sourceWidth,
  ]);

  const canResize =
    Boolean(file) &&
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    isValidResizeDimensions(outputWidth, outputHeight) &&
    !busy &&
    environment?.canRun !== false;

  return (
    <div className={clsx("video-resizer-tool space-y-4", className)}>
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
              {sourceWidth > 0
                ? ` · ${sourceWidth}×${sourceHeight}`
                : null}
            </p>
            <button type="button" className={toolOutlineBtn} disabled={busy} onClick={handleReset}>
              {labels.resizeAnother}
            </button>
          </div>

          <p className="text-sm text-neutral-400">{labels.instructions}</p>

          {previewUrl ? (
            <div className="space-y-2 rounded-none border border-neutral-800 bg-neutral-950 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {labels.cropPreviewLabel}
                </p>
                <p className="text-xs text-neutral-500">{labels.cropPreviewHint}</p>
              </div>
              <div
                ref={frameRef}
                className="relative aspect-video w-full overflow-hidden bg-black"
              >
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                  onLoadedMetadata={onVideoMetadata}
                />
                {cropOverlayStyle ? (
                  <div
                    className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                    style={{
                      left: cropOverlayStyle.left,
                      top: cropOverlayStyle.top,
                      width: cropOverlayStyle.width,
                      height: cropOverlayStyle.height,
                    }}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <fieldset className="space-y-4 rounded-none border border-neutral-800 bg-neutral-950 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              {labels.presetsLabel}
            </legend>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ASPECT_RATIO_PRESETS.map((preset) => {
                const Icon = PRESET_ICONS[preset.id];
                const selected = presetId === preset.id;
                const label =
                  preset.labelKey === "preset916"
                    ? labels.preset916
                    : preset.labelKey === "preset11"
                      ? labels.preset11
                      : labels.preset169;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={busy}
                    onClick={() => applyPreset(preset.id)}
                    className={clsx(
                      "flex flex-col items-start gap-2 rounded-none border p-3 text-left transition-colors",
                      selected
                        ? "border-white bg-[#111] text-white"
                        : "border-[color:var(--im-tool-control-border)] bg-[color:var(--im-tool-control-bg)] text-neutral-300 hover:border-neutral-600 hover:text-white",
                    )}
                    aria-pressed={selected}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="text-sm font-semibold text-white">{preset.ratioLabel}</span>
                    <span className="text-xs leading-snug text-neutral-400">{label}</span>
                    <span className="text-xs tabular-nums text-neutral-500">
                      {preset.width}×{preset.height}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                disabled={busy}
                onClick={() => applyPreset("custom")}
                className={clsx(
                  "flex flex-col items-start gap-2 rounded-none border p-3 text-left transition-colors",
                  presetId === "custom"
                    ? "border-white bg-[#111] text-white"
                    : "border-[color:var(--im-tool-control-border)] bg-[color:var(--im-tool-control-bg)] text-neutral-300 hover:border-neutral-600 hover:text-white",
                )}
                aria-pressed={presetId === "custom"}
              >
                <Maximize2 className="h-5 w-5" aria-hidden />
                <span className="text-sm font-semibold text-white">{labels.customLabel}</span>
                <span className="text-xs leading-snug text-neutral-400">
                  {labels.widthLabel} × {labels.heightLabel}
                </span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={widthId} className="text-sm font-medium text-neutral-200">
                  {labels.widthLabel}
                </label>
                <input
                  id={widthId}
                  type="number"
                  min={16}
                  max={7680}
                  step={2}
                  value={outputWidth}
                  disabled={busy}
                  onChange={(event) => {
                    setPresetId("custom");
                    setOutputWidth(Number(event.target.value) || 0);
                    setDimensionsError("");
                  }}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={heightId} className="text-sm font-medium text-neutral-200">
                  {labels.heightLabel}
                </label>
                <input
                  id={heightId}
                  type="number"
                  min={16}
                  max={7680}
                  step={2}
                  value={outputHeight}
                  disabled={busy}
                  onChange={(event) => {
                    setPresetId("custom");
                    setOutputHeight(Number(event.target.value) || 0);
                    setDimensionsError("");
                  }}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
              <span>
                {labels.sourceSizeLabel}:{" "}
                <span className="font-semibold text-white">
                  {sourceWidth > 0 ? `${sourceWidth}×${sourceHeight}` : "—"}
                </span>
              </span>
              <span>
                {labels.outputSizeLabel}:{" "}
                <span className="font-semibold text-amber-200">
                  {evenFloor(outputWidth)}×{evenFloor(outputHeight)}
                </span>
              </span>
            </div>
          </fieldset>

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
            {!busy && phase !== "success" ? (
              <button
                type="button"
                className={clsx(toolPrimaryBtn, "w-full sm:w-auto")}
                disabled={!canResize}
                onClick={() => void resizeFile()}
              >
                {busy || phase === "loading" || phase === "processing" ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    {labels.resizing}
                  </>
                ) : (
                  labels.resizeAndDownload
                )}
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
                  {labels.downloadAgain}
                </button>
                <ToolSuccessEngagement pageTitle={headline} className="!mt-0" />
                <button type="button" className={toolOutlineBtn} onClick={handleReset}>
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
          </div>
        </div>
      )}
    </div>
  );
}
