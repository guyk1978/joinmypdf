"use client";

import { clsx } from "clsx";
import { Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from "react";
import { imBtnCta } from "@/lib/design-system";
import {
  clampDimension,
  dimensionsWithAspect,
  downloadBlob,
  getResizedImageBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
  resizeImageOutputName,
} from "@/lib/resize-image";

export type ResizeImageLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  resizeInstructions: string;
  widthLabel: string;
  heightLabel: string;
  lockAspectRatio: string;
  formatOriginalSize: (width: number, height: number) => string;
  resizeAndDownload: string;
  resizing: string;
  invalidFile: string;
  invalidDimensions: string;
  replaceImage: string;
};

export type ResizeImageProps = {
  labels: ResizeImageLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

export function ResizeImage({ labels, className, onDownload }: ResizeImageProps) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const aspectRatio =
    naturalSize && naturalSize.height > 0 ? naturalSize.width / naturalSize.height : 1;

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
    setWidthInput("");
    setHeightInput("");
    setLockAspectRatio(true);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

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
        setWidthInput("");
        setHeightInput("");
        setLockAspectRatio(true);
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
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    setNaturalSize({ width, height });
    setWidthInput(String(width));
    setHeightInput(String(height));
  };

  const parseDimensions = () => {
    const width = clampDimension(Number(widthInput));
    const height = clampDimension(Number(heightInput));

    if (!Number.isFinite(Number(widthInput)) || !Number.isFinite(Number(heightInput))) {
      return null;
    }

    if (width < 1 || height < 1) return null;
    return { width, height };
  };

  const onWidthChange = (value: string) => {
    setWidthInput(value);
    const width = Number(value);
    if (!lockAspectRatio || !Number.isFinite(width) || width <= 0) return;

    setHeightInput(String(clampDimension(width / aspectRatio)));
  };

  const onHeightChange = (value: string) => {
    setHeightInput(value);
    const height = Number(value);
    if (!lockAspectRatio || !Number.isFinite(height) || height <= 0) return;

    setWidthInput(String(clampDimension(height * aspectRatio)));
  };

  const onWidthBlur = () => {
    const width = clampDimension(Number(widthInput));
    setWidthInput(String(width));

    if (!lockAspectRatio) return;
    const next = dimensionsWithAspect({ width, height: Number(heightInput) }, "width", aspectRatio);
    setHeightInput(String(next.height));
  };

  const onHeightBlur = () => {
    const height = clampDimension(Number(heightInput));
    setHeightInput(String(height));

    if (!lockAspectRatio) return;
    const next = dimensionsWithAspect({ width: Number(widthInput), height }, "height", aspectRatio);
    setWidthInput(String(next.width));
  };

  const handleResizeAndDownload = async () => {
    if (!imageSrc || !sourceFile || busy) return;

    const dimensions = parseDimensions();
    if (!dimensions) {
      setError(labels.invalidDimensions);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const blob = await getResizedImageBlob(imageSrc, dimensions, sourceFile);
      const filename = resizeImageOutputName(sourceFile.name, blob.type);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setError(labels.invalidFile);
    } finally {
      setBusy(false);
    }
  };

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
          <p className="crop-image-tool__instructions">{labels.resizeInstructions}</p>

          <div className="crop-image-tool__stage crop-image-tool__stage--preview">
            <img
              src={imageSrc}
              alt=""
              className="crop-image-tool__img"
              draggable={false}
              onLoad={onImageLoad}
            />
          </div>

          {naturalSize ? (
            <div className="crop-image-tool__form">
              <p className="crop-image-tool__meta">
                {labels.formatOriginalSize(naturalSize.width, naturalSize.height)}
              </p>

              <div className="crop-image-tool__form-row">
                <div className="crop-image-tool__field">
                  <label htmlFor={`${formId}-width`}>{labels.widthLabel}</label>
                  <input
                    id={`${formId}-width`}
                    type="number"
                    min={1}
                    max={16000}
                    inputMode="numeric"
                    value={widthInput}
                    onChange={(event) => onWidthChange(event.target.value)}
                    onBlur={onWidthBlur}
                    className="crop-image-tool__input"
                  />
                </div>

                <div className="crop-image-tool__field">
                  <label htmlFor={`${formId}-height`}>{labels.heightLabel}</label>
                  <input
                    id={`${formId}-height`}
                    type="number"
                    min={1}
                    max={16000}
                    inputMode="numeric"
                    value={heightInput}
                    onChange={(event) => onHeightChange(event.target.value)}
                    onBlur={onHeightBlur}
                    className="crop-image-tool__input"
                  />
                </div>
              </div>

              <label className="crop-image-tool__checkbox">
                <input
                  type="checkbox"
                  checked={lockAspectRatio}
                  onChange={(event) => setLockAspectRatio(event.target.checked)}
                />
                <span>{labels.lockAspectRatio}</span>
              </label>
            </div>
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
              onClick={() => void handleResizeAndDownload()}
              disabled={busy || !naturalSize}
            >
              {busy ? labels.resizing : labels.resizeAndDownload}
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
