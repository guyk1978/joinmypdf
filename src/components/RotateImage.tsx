"use client";

import { clsx } from "clsx";
import { RotateCcw, RotateCw, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from "react";
import { imBtnCta } from "@/lib/design-system";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import {
  downloadBlob,
  getRotatedImageBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
  normalizeRotation,
  rotateImageOutputName,
  type RotationDegrees,
} from "@/lib/rotate-image";

export type RotateImageLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  rotateInstructions: string;
  rotateLeft: string;
  rotateRight: string;
  formatRotation: (degrees: number) => string;
  download: string;
  downloading: string;
  invalidFile: string;
  replaceImage: string;
};

export type RotateImageProps = {
  labels: RotateImageLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

export function RotateImage({ labels, className, onDownload }: RotateImageProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [rotation, setRotation] = useState<RotationDegrees>(0);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeObjectUrl, [revokeObjectUrl]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setRotation(0);
    setError("");
    setShowFeedback(false);
    registerFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [registerFile, revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      revokeObjectUrl();

      try {
        const url = await loadImageFileForCrop(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
        setRotation(0);
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

  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const rotateLeft = () => {
    setRotation((current) => normalizeRotation(current - 90));
  };

  const rotateRight = () => {
    setRotation((current) => normalizeRotation(current + 90));
  };

  const handleDownload = async () => {
    if (!imageSrc || !sourceFile || busy) return;

    setBusy(true);
    setError("");

    try {
      const blob = await getRotatedImageBlob(imageSrc, rotation, sourceFile);
      const filename = rotateImageOutputName(sourceFile.name, blob.type);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
      registerFile(sourceFile, slug);
      setShowFeedback(true);
    } catch {
      setError(labels.invalidFile);
    } finally {
      setBusy(false);
    }
  };

  const previewSwapped = rotation === 90 || rotation === 270;

  return (
    <div className={clsx("crop-image-tool", className)}>
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
          <p className="crop-image-tool__instructions">{labels.rotateInstructions}</p>

          <div
            className={clsx(
              "crop-image-tool__stage crop-image-tool__stage--preview",
              previewSwapped && "crop-image-tool__stage--rotated",
            )}
          >
            <img
              src={imageSrc}
              alt=""
              className="crop-image-tool__img crop-image-tool__img--rotatable"
              style={{ transform: `rotate(${rotation}deg)` }}
              draggable={false}
              onLoad={onImageLoad}
            />
          </div>

          {naturalSize ? (
            <p className="crop-image-tool__meta">{labels.formatRotation(rotation)}</p>
          ) : null}

          <div className="crop-image-tool__toolbar">
            <button
              type="button"
              className="crop-image-tool__rotate-btn"
              onClick={rotateLeft}
              disabled={busy}
              aria-label={labels.rotateLeft}
            >
              <RotateCcw strokeWidth={2} aria-hidden />
              <span>{labels.rotateLeft}</span>
            </button>
            <button
              type="button"
              className="crop-image-tool__rotate-btn"
              onClick={rotateRight}
              disabled={busy}
              aria-label={labels.rotateRight}
            >
              <RotateCw strokeWidth={2} aria-hidden />
              <span>{labels.rotateRight}</span>
            </button>
          </div>

          {showFeedback ? <ToolSuccessEngagement pageTitle={headline} /> : null}

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
              disabled={busy || !naturalSize}
            >
              {busy ? labels.downloading : labels.download}
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
