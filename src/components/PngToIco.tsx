"use client";

import { clsx } from "clsx";
import { Upload } from "lucide-react";
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
  convertPngImageToIco,
  downloadBlob,
  drawImageToSquareCanvas,
  isAcceptedPngFile,
  loadPngFileForPreview,
  pngToIcoOutputName,
} from "@/lib/png-to-ico";
import { createImage } from "@/lib/crop-image";

export type PngToIcoLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string, width: number, height: number) => string;
  previewFaviconLabel: string;
  downloadIco: string;
  converting: string;
  convertingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceImage: string;
};

export type PngToIcoProps = {
  labels: PngToIcoLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/png,.png";

export function PngToIco({ labels, className, onDownload }: PngToIcoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
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
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [revokeObjectUrl]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedPngFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setProgress(0);
      revokeObjectUrl();

      try {
        const url = await loadPngFileForPreview(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
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
    if (!imageSrc || !naturalSize) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    void createImage(imageSrc).then((img) => {
      if (cancelled) return;
      const square = drawImageToSquareCanvas(img, 32);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 32;
      canvas.height = 32;
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(square, 0, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, naturalSize]);

  const startProgress = () => {
    setProgress(8);
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? current : current + 9));
    }, 120);
  };

  const stopProgress = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
  };

  const handleDownloadIco = async () => {
    if (!sourceFile || !imageSrc || busy) return;

    setBusy(true);
    setError("");
    startProgress();

    try {
      const blob = await convertPngImageToIco(imageSrc);
      const filename = pngToIcoOutputName(sourceFile.name);
      stopProgress();
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      stopProgress();
      setProgress(0);
      setError(labels.convertFailed);
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <div className={clsx("crop-image-tool png-to-ico-tool", className)}>
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
          <p className="crop-image-tool__instructions">{labels.convertInstructions}</p>

          <div className="png-to-ico-tool__preview-grid">
            <div className="crop-image-tool__stage crop-image-tool__stage--preview">
              <img
                src={imageSrc}
                alt=""
                className="crop-image-tool__img"
                draggable={false}
                onLoad={onImageLoad}
              />
            </div>

            <div className="png-to-ico-tool__favicon-preview tool-workspace-panel">
              <p className="png-to-ico-tool__favicon-label">{labels.previewFaviconLabel}</p>
              <div className="png-to-ico-tool__favicon-canvas-wrap">
                <canvas
                  ref={previewCanvasRef}
                  width={32}
                  height={32}
                  className="png-to-ico-tool__favicon-canvas"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {sourceFile && naturalSize ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
            </p>
          ) : null}

          {busy ? (
            <WorkspaceProgressBar percent={progress} label={labels.convertingProgress} />
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
              onClick={() => void handleDownloadIco()}
              disabled={busy || !naturalSize}
            >
              {busy ? labels.converting : labels.downloadIco}
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
