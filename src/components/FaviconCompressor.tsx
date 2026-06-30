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
  type SyntheticEvent,
} from "react";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { imBtnCta } from "@/lib/design-system";
import {
  compressFaviconFile,
  compressionSavingsPercent,
  downloadBlob,
  faviconCompressorOutputName,
  formatBytes,
  isAcceptedFaviconCompressorFile,
  isIcoFaviconSource,
  loadFaviconCompressorPreview,
  type FaviconCompressorResult,
} from "@/lib/favicon-compressor";

export type FaviconCompressorLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  compressInstructions: string;
  formatFileInfo: (name: string, width: number, height: number) => string;
  formatIcoFileInfo: (name: string, frameCount: number) => string;
  originalSize: string;
  compressedSize: string;
  estimatingSize: string;
  formatSavings: (percent: number) => string;
  downloadOptimized: string;
  optimizing: string;
  optimizingProgress: string;
  invalidFile: string;
  optimizeFailed: string;
  replaceFile: string;
};

export type FaviconCompressorProps = {
  labels: FaviconCompressorLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/x-icon,image/vnd.microsoft.icon,.ico,image/png,image/jpeg,.ico,.png,.jpg,.jpeg";
const ESTIMATE_DEBOUNCE_MS = 280;

export function FaviconCompressor({ labels, className, onDownload }: FaviconCompressorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const estimateTimerRef = useRef<number | null>(null);
  const estimateRequestRef = useRef(0);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [icoFrameCount, setIcoFrameCount] = useState<number | null>(null);
  const [result, setResult] = useState<FaviconCompressorResult | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrl();
      if (estimateTimerRef.current !== null) {
        window.clearTimeout(estimateTimerRef.current);
      }
    };
  }, [revokePreviewUrl]);

  const reset = useCallback(() => {
    revokePreviewUrl();
    setSourceFile(null);
    setPreviewUrl(null);
    setImageSrc(null);
    setNaturalSize(null);
    setIcoFrameCount(null);
    setResult(null);
    setEstimating(false);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokePreviewUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFaviconCompressorFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setResult(null);
      setNaturalSize(null);
      setIcoFrameCount(null);
      revokePreviewUrl();

      try {
        const preview = await loadFaviconCompressorPreview(file);
        previewUrlRef.current = preview.previewUrl;
        setSourceFile(file);
        setPreviewUrl(preview.previewUrl);
        setImageSrc(isIcoFaviconSource(file) ? null : preview.previewUrl);
        setIcoFrameCount(preview.frameCount ?? null);
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, revokePreviewUrl],
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
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  useEffect(() => {
    if (!sourceFile || !previewUrl) {
      setResult(null);
      setEstimating(false);
      return;
    }

    if (!isIcoFaviconSource(sourceFile) && !naturalSize) {
      return;
    }

    if (estimateTimerRef.current !== null) {
      window.clearTimeout(estimateTimerRef.current);
    }

    setEstimating(true);
    const requestId = estimateRequestRef.current + 1;
    estimateRequestRef.current = requestId;

    estimateTimerRef.current = window.setTimeout(() => {
      void compressFaviconFile(sourceFile, imageSrc ?? undefined)
        .then((compressed) => {
          if (estimateRequestRef.current !== requestId) return;
          setResult(compressed);
        })
        .catch(() => {
          if (estimateRequestRef.current !== requestId) return;
          setResult(null);
          setError(labels.optimizeFailed);
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
  }, [sourceFile, previewUrl, imageSrc, naturalSize, labels.optimizeFailed]);

  const handleDownload = async () => {
    if (!sourceFile || busy) return;

    setBusy(true);
    setError("");
    setProgress(25);

    try {
      const compressed = result ?? (await compressFaviconFile(sourceFile, imageSrc ?? undefined));
      setProgress(100);
      const filename = faviconCompressorOutputName(sourceFile.name, compressed.mime);
      downloadBlob(compressed.blob, filename);
      onDownload?.(compressed.blob, filename);
      setResult(compressed);
    } catch {
      setProgress(0);
      setError(labels.optimizeFailed);
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  const savingsPercent =
    sourceFile && result
      ? compressionSavingsPercent(sourceFile.size, result.compressedBytes)
      : 0;

  const readyToDownload =
    Boolean(sourceFile) &&
    (isIcoFaviconSource(sourceFile!) || Boolean(naturalSize)) &&
    !estimating &&
    Boolean(result);

  return (
    <div className={clsx("crop-image-tool favicon-compressor-tool", className)}>
      {!previewUrl ? (
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

          <div className="favicon-compressor-tool__layout">
            <div className="crop-image-tool__stage crop-image-tool__stage--preview favicon-compressor-tool__preview tool-workspace-panel">
              <img
                src={previewUrl}
                alt=""
                className="crop-image-tool__img"
                draggable={false}
                onLoad={onImageLoad}
              />
            </div>

            {sourceFile ? (
              <div className="favicon-compressor-tool__metrics tool-workspace-panel">
                {naturalSize ? (
                  <p className="crop-image-tool__meta">
                    {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
                  </p>
                ) : icoFrameCount ? (
                  <p className="crop-image-tool__meta">
                    {labels.formatIcoFileInfo(sourceFile.name, icoFrameCount)}
                  </p>
                ) : null}

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
                        : result
                          ? formatBytes(result.compressedBytes)
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
          </div>

          {busy ? <WorkspaceProgressBar percent={progress} label={labels.optimizingProgress} /> : null}

          <div className="crop-image-tool__actions">
            <button
              type="button"
              className="crop-image-tool__secondary-btn"
              onClick={reset}
              disabled={busy}
            >
              {labels.replaceFile}
            </button>
            <button
              type="button"
              className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
              onClick={() => void handleDownload()}
              disabled={busy || !readyToDownload}
            >
              <Download className="h-4 w-4" aria-hidden />
              {busy ? labels.optimizing : labels.downloadOptimized}
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
