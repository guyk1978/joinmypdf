"use client";

import { clsx } from "clsx";
import { Download, Upload } from "lucide-react";
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
import { loadImageFileForCrop } from "@/lib/crop-image";
import {
  applyColorsToAlpha,
  DEFAULT_TRANSPARENT_COLOR_TOLERANCE,
  downloadBlob,
  formatRgbColor,
  imageDataToPngBlob,
  isAcceptedTransparentFaviconFile,
  loadTransparentFaviconImageData,
  sampleColorAtPixel,
  transparentFaviconOutputName,
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
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

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
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, revokeObjectUrl],
  );

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

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

    setLastPickedColor(color);
    setPickedColors((current) => {
      const exists = current.some(
        (entry) => entry.r === color.r && entry.g === color.g && entry.b === color.b,
      );
      if (exists) return current;
      return [...current, color];
    });
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
      const blob = await imageDataToPngBlob(processed);
      const filename = transparentFaviconOutputName(sourceFile.name);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setError(labels.exportFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={clsx("crop-image-tool transparent-favicon-tool", className)}>
      {!imageSrc ? (
        <div
          className={clsx(
            "crop-image-tool__dropzone",
            dragActive && "crop-image-tool__dropzone--active",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragActive(false);
          }}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label={labels.selectFileAria}
            onChange={onInputChange}
          />

          <Upload className="crop-image-tool__dropzone-icon" strokeWidth={1.75} aria-hidden />

          <p className="crop-image-tool__dropzone-title">{labels.dropTitle}</p>
          <p className="crop-image-tool__dropzone-hint">{labels.dropHint}</p>

          <button
            type="button"
            className={clsx(imBtnCta, "crop-image-tool__select-btn")}
            onClick={() => inputRef.current?.click()}
          >
            {labels.selectFile}
          </button>
        </div>
      ) : (
        <div className="crop-image-tool__workspace">
          <p className="crop-image-tool__instructions">{labels.pickInstructions}</p>

          <div className="transparent-favicon-tool__preview tool-workspace-panel">
            <div className="transparent-favicon-tool__checkerboard">
              <canvas
                ref={canvasRef}
                className="transparent-favicon-tool__canvas"
                onClick={onCanvasClick}
                role="img"
                aria-label={labels.pickInstructions}
              />
            </div>
          </div>

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
