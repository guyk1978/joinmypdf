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
  clampCompressQuality,
  compressImageOutputName,
  compressionSavingsPercent,
  DEFAULT_COMPRESS_QUALITY,
  downloadBlob,
  formatBytes,
  getCompressedImageBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
  MAX_COMPRESS_QUALITY,
  MIN_COMPRESS_QUALITY,
} from "@/lib/compress-image";

export type CompressImageLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  compressInstructions: string;
  qualityLabel: string;
  formatQuality: (percent: number) => string;
  originalSize: string;
  compressedSize: string;
  estimatingSize: string;
  formatSavings: (percent: number) => string;
  compressAndDownload: string;
  compressing: string;
  invalidFile: string;
  replaceImage: string;
};

export type CompressImageProps = {
  labels: CompressImageLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

const ESTIMATE_DEBOUNCE_MS = 280;

export function CompressImage({ labels, className, onDownload }: CompressImageProps) {
  const sliderId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const estimateTimerRef = useRef<number | null>(null);
  const estimateRequestRef = useRef(0);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [quality, setQuality] = useState(DEFAULT_COMPRESS_QUALITY);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl();
      if (estimateTimerRef.current !== null) {
        window.clearTimeout(estimateTimerRef.current);
      }
    };
  }, [revokeObjectUrl]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setQuality(DEFAULT_COMPRESS_QUALITY);
    setCompressedSize(null);
    setEstimating(false);
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
      setCompressedSize(null);
      revokeObjectUrl();

      try {
        const url = await loadImageFileForCrop(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
        setQuality(DEFAULT_COMPRESS_QUALITY);
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

  useEffect(() => {
    if (!imageSrc || !sourceFile || !naturalSize) {
      setCompressedSize(null);
      setEstimating(false);
      return;
    }

    if (estimateTimerRef.current !== null) {
      window.clearTimeout(estimateTimerRef.current);
    }

    setEstimating(true);
    const requestId = estimateRequestRef.current + 1;
    estimateRequestRef.current = requestId;

    estimateTimerRef.current = window.setTimeout(() => {
      void getCompressedImageBlob(imageSrc, quality, sourceFile)
        .then((blob) => {
          if (estimateRequestRef.current !== requestId) return;
          setCompressedSize(blob.size);
        })
        .catch(() => {
          if (estimateRequestRef.current !== requestId) return;
          setCompressedSize(null);
        })
        .finally(() => {
          if (estimateRequestRef.current !== requestId) return;
          setEstimating(false);
        });
    }, ESTIMATE_DEBOUNCE_MS);

    return () => {
      if (estimateTimerRef.current !== null) {
        window.clearTimeout(estimateTimerRef.current);
      }
    };
  }, [imageSrc, naturalSize, quality, sourceFile]);

  const handleCompressAndDownload = async () => {
    if (!imageSrc || !sourceFile || busy) return;

    setBusy(true);
    setError("");

    try {
      const blob = await getCompressedImageBlob(imageSrc, quality, sourceFile);
      const filename = compressImageOutputName(sourceFile.name, blob.type);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setError(labels.invalidFile);
    } finally {
      setBusy(false);
    }
  };

  const savingsPercent =
    sourceFile && compressedSize !== null
      ? compressionSavingsPercent(sourceFile.size, compressedSize)
      : 0;

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
          <p className="crop-image-tool__instructions">{labels.compressInstructions}</p>

          <div className="crop-image-tool__stage crop-image-tool__stage--preview">
            <img
              src={imageSrc}
              alt=""
              className="crop-image-tool__img"
              draggable={false}
              onLoad={onImageLoad}
            />
          </div>

          {naturalSize && sourceFile ? (
            <div className="crop-image-tool__form">
              <div className="crop-image-tool__slider-row">
                <label htmlFor={sliderId} className="crop-image-tool__slider-label">
                  {labels.qualityLabel}
                </label>
                <span className="crop-image-tool__slider-value">{labels.formatQuality(quality)}</span>
              </div>

              <input
                id={sliderId}
                type="range"
                min={MIN_COMPRESS_QUALITY}
                max={MAX_COMPRESS_QUALITY}
                step={1}
                value={quality}
                onChange={(event) => setQuality(clampCompressQuality(Number(event.target.value)))}
                className="crop-image-tool__range"
                disabled={busy}
                aria-valuemin={MIN_COMPRESS_QUALITY}
                aria-valuemax={MAX_COMPRESS_QUALITY}
                aria-valuenow={quality}
                aria-valuetext={labels.formatQuality(quality)}
              />

              <div className="crop-image-tool__size-compare">
                <div className="crop-image-tool__size-card">
                  <span className="crop-image-tool__size-label">{labels.originalSize}</span>
                  <span className="crop-image-tool__size-value">{formatBytes(sourceFile.size)}</span>
                </div>
                <div className="crop-image-tool__size-card crop-image-tool__size-card--compressed">
                  <span className="crop-image-tool__size-label">{labels.compressedSize}</span>
                  <span className="crop-image-tool__size-value">
                    {estimating
                      ? labels.estimatingSize
                      : compressedSize !== null
                        ? formatBytes(compressedSize)
                        : "—"}
                  </span>
                  {!estimating && savingsPercent > 0 ? (
                    <span className="crop-image-tool__size-savings">
                      {labels.formatSavings(savingsPercent)}
                    </span>
                  ) : null}
                </div>
              </div>
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
              onClick={() => void handleCompressAndDownload()}
              disabled={busy || !naturalSize || estimating}
            >
              {busy ? labels.compressing : labels.compressAndDownload}
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
