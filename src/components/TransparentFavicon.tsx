"use client";

import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Download, Lock, Shield } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import { imBtnCta } from "@/lib/design-system";
import {
  TransparentFaviconBrowserMockup,
  type TransparentFaviconBrowserMockupLabels,
} from "@/components/TransparentFaviconBrowserMockup";
import { loadImageFileForCrop } from "@/lib/crop-image";
import {
  applyColorsToAlpha,
  colorsMatch,
  DEFAULT_TRANSPARENT_COLOR_TOLERANCE,
  detectDominantBackgroundColor,
  downloadBlob,
  exportTransparentFaviconPng,
  formatRgbColor,
  isAcceptedTransparentFaviconFile,
  loadTransparentFaviconImageData,
  sampleColorAtPixel,
  TRANSPARENT_FAVICON_EXPORT_OPTIONS,
  transparentFaviconOutputName,
  type TransparentFaviconExportSize,
  type RgbColor,
} from "@/lib/transparent-favicon";

export type TransparentFaviconLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  pickInstructions: string;
  formatPickedColor: (color: string) => string;
  downloadTransparent: string;
  exporting: string;
  invalidFile: string;
  exportFailed: string;
  replaceImage: string;
  checkerboardPreviewLabel: string;
  checkerboardPreviewHint: string;
  checkerboardLegend: string;
  securityStatusTitle: string;
  securityStatusWaiting: string;
  securityStatusLocal: string;
  formatAutoSelectPrompt: (color: string) => string;
  autoSelectConfirm: string;
  autoSelectDismiss: string;
  exportSettingsLabel: string;
  exportSettingsHint: string;
  formatExportSize: (key: string) => string;
  browserMockup: TransparentFaviconBrowserMockupLabels;
};

export type TransparentFaviconProps = {
  labels: TransparentFaviconLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";

export function TransparentFavicon({ labels, className, onDownload }: TransparentFaviconProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [pickedColors, setPickedColors] = useState<RgbColor[]>([]);
  const [lastPickedColor, setLastPickedColor] = useState<RgbColor | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkerboardPreview, setCheckerboardPreview] = useState(false);
  const [autoDetectedColor, setAutoDetectedColor] = useState<RgbColor | null>(null);
  const [autoSelectDismissed, setAutoSelectDismissed] = useState(false);
  const [exportSize, setExportSize] = useState<TransparentFaviconExportSize>("native");
  const [mockupDataUrl, setMockupDataUrl] = useState<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  const drawProcessedImage = useCallback((colors: RgbColor[]) => {
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    if (!canvas || !original) return;

    const processed = applyColorsToAlpha(
      original,
      colors,
      DEFAULT_TRANSPARENT_COLOR_TOLERANCE,
    );
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(processed, 0, 0);
  }, []);

  useEffect(() => {
    drawProcessedImage(pickedColors);
  }, [pickedColors, drawProcessedImage, naturalSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pickedColors.length) {
      setMockupDataUrl(null);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setMockupDataUrl(canvas.toDataURL("image/png"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pickedColors, naturalSize, drawProcessedImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    if (!canvas || !original || !naturalSize) return;

    canvas.width = naturalSize.width;
    canvas.height = naturalSize.height;
    drawProcessedImage(pickedColors);
  }, [naturalSize, pickedColors, drawProcessedImage]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    originalImageDataRef.current = null;
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setPickedColors([]);
    setLastPickedColor(null);
    setCheckerboardPreview(false);
    setAutoDetectedColor(null);
    setAutoSelectDismissed(false);
    setExportSize("native");
    setMockupDataUrl(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const applyPickedColor = useCallback((color: RgbColor) => {
    setLastPickedColor(color);
    setPickedColors((current) => {
      const exists = current.some((entry) => colorsMatch(entry, color));
      if (exists) return current;
      return [...current, color];
    });
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedTransparentFaviconFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      revokeObjectUrl();

      try {
        const url = await loadImageFileForCrop(file);
        objectUrlRef.current = url;
        const { imageData, width, height } = await loadTransparentFaviconImageData(url);

        originalImageDataRef.current = imageData;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize({ width, height });
        setPickedColors([]);
        setLastPickedColor(null);
        setCheckerboardPreview(false);
        setAutoSelectDismissed(false);
        setExportSize("native");
        setAutoDetectedColor(detectDominantBackgroundColor(imageData));
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, revokeObjectUrl],
  );

  const onCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    if (!canvas || !original) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const color = sampleColorAtPixel(original, x, y);
    if (!color) return;

    applyPickedColor(color);
    setAutoSelectDismissed(true);
  };

  const handleDownload = async () => {
    if (!sourceFile || !originalImageDataRef.current || busy || !pickedColors.length) return;

    setBusy(true);
    setError("");

    try {
      const processed = applyColorsToAlpha(
        originalImageDataRef.current,
        pickedColors,
        DEFAULT_TRANSPARENT_COLOR_TOLERANCE,
      );
      const blob = await exportTransparentFaviconPng(processed, exportSize);
      const filename = transparentFaviconOutputName(sourceFile.name, exportSize);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setError(labels.exportFailed);
    } finally {
      setBusy(false);
    }
  };

  const securityStatus = (
    <p
      className={clsx(
        "transparent-favicon-tool__security-status",
        imageSrc
          ? "transparent-favicon-tool__security-status--local"
          : "transparent-favicon-tool__security-status--waiting",
      )}
      role="status"
      aria-live="polite"
    >
      {imageSrc ? (
        <Lock className="transparent-favicon-tool__security-status-icon" strokeWidth={2} aria-hidden />
      ) : (
        <Shield className="transparent-favicon-tool__security-status-icon" strokeWidth={2} aria-hidden />
      )}
      <span className="transparent-favicon-tool__security-status-label">{labels.securityStatusTitle}</span>
      <span className="transparent-favicon-tool__security-status-value">
        {imageSrc ? labels.securityStatusLocal : labels.securityStatusWaiting}
      </span>
    </p>
  );

  const showAutoSelectPrompt =
    autoDetectedColor &&
    !autoSelectDismissed &&
    !pickedColors.some((color) => colorsMatch(color, autoDetectedColor));

  const autoSelectPrompt = showAutoSelectPrompt ? (
    <div className="transparent-favicon-tool__auto-select tool-workspace-panel" role="status">
      <div className="transparent-favicon-tool__auto-select-header">
        <span
          className="transparent-favicon-tool__auto-select-swatch"
          style={{ backgroundColor: formatRgbColor(autoDetectedColor) }}
          aria-hidden
        />
        <p className="transparent-favicon-tool__auto-select-text">
          {labels.formatAutoSelectPrompt(formatRgbColor(autoDetectedColor))}
        </p>
      </div>
      <div className="transparent-favicon-tool__auto-select-actions">
        <button
          type="button"
          className={clsx(imBtnCta, "transparent-favicon-tool__auto-select-confirm")}
          onClick={() => {
            applyPickedColor(autoDetectedColor);
            setAutoSelectDismissed(true);
          }}
          disabled={busy}
        >
          {labels.autoSelectConfirm}
        </button>
        <button
          type="button"
          className="transparent-favicon-tool__auto-select-dismiss"
          onClick={() => setAutoSelectDismissed(true)}
          disabled={busy}
        >
          {labels.autoSelectDismiss}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className={clsx("crop-image-tool transparent-favicon-tool", className)}>
      {!imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["PNG", "JPG"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="crop-image-tool__workspace">
          {securityStatus}

          <p className="crop-image-tool__instructions">{labels.pickInstructions}</p>

          {autoSelectPrompt}

          <div className="transparent-favicon-tool__preview-controls tool-workspace-panel">
            <label className="transparent-favicon-tool__preview-toggle">
              <input
                type="checkbox"
                checked={checkerboardPreview}
                onChange={(event) => setCheckerboardPreview(event.target.checked)}
                disabled={busy}
              />
              <span className="transparent-favicon-tool__preview-toggle-title">
                {labels.checkerboardPreviewLabel}
              </span>
            </label>
            <p className="transparent-favicon-tool__preview-toggle-hint">
              {labels.checkerboardPreviewHint}
            </p>
          </div>

          <div className="transparent-favicon-tool__preview tool-workspace-panel">
            <div
              className={clsx(
                "transparent-favicon-tool__stage-bg",
                checkerboardPreview
                  ? "transparent-favicon-tool__stage-bg--checkerboard"
                  : "transparent-favicon-tool__stage-bg--solid",
              )}
            >
              <canvas
                ref={canvasRef}
                className="transparent-favicon-tool__canvas"
                onClick={onCanvasClick}
                role="img"
                aria-label={labels.pickInstructions}
              />
            </div>
            {checkerboardPreview ? (
              <p className="transparent-favicon-tool__checkerboard-legend" role="note">
                {labels.checkerboardLegend}
              </p>
            ) : null}
          </div>

          <TransparentFaviconBrowserMockup
            previewDataUrl={mockupDataUrl}
            labels={labels.browserMockup}
          />

          {lastPickedColor ? (
            <p className="transparent-favicon-tool__color-meta">
              <span
                className="transparent-favicon-tool__color-swatch"
                style={{ backgroundColor: formatRgbColor(lastPickedColor) }}
                aria-hidden
              />
              {labels.formatPickedColor(formatRgbColor(lastPickedColor))}
            </p>
          ) : null}

          {naturalSize ? (
            <p className="crop-image-tool__meta">
              {naturalSize.width} × {naturalSize.height} px
            </p>
          ) : null}

          <div className="transparent-favicon-tool__export-settings tool-workspace-panel">
            <span className="transparent-favicon-tool__export-label" id="transparent-favicon-export-label">
              {labels.exportSettingsLabel}
            </span>
            <p className="transparent-favicon-tool__export-hint">{labels.exportSettingsHint}</p>
            <div
              className="transparent-favicon-tool__export-row"
              role="radiogroup"
              aria-labelledby="transparent-favicon-export-label"
            >
              {TRANSPARENT_FAVICON_EXPORT_OPTIONS.map((option) => (
                <label key={String(option.value)} className="transparent-favicon-tool__export-option">
                  <input
                    type="radio"
                    name="transparent-favicon-export-size"
                    checked={exportSize === option.value}
                    onChange={() => setExportSize(option.value)}
                    disabled={busy || !naturalSize}
                  />
                  <span>{labels.formatExportSize(option.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="crop-image-tool__actions">
            <button
              type="button"
              className="crop-image-tool__secondary-btn"
              onClick={reset}
              disabled={busy}
            >
              {labels.replaceImage}
            </button>
            <button
              type="button"
              className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
              onClick={() => void handleDownload()}
              disabled={busy || !pickedColors.length}
            >
              <Download className="h-4 w-4" aria-hidden />
              {busy ? labels.exporting : labels.downloadTransparent}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="crop-image-tool__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
