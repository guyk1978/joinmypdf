"use client";

import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";

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
  convertImageToPngBlob,
  convertToPngOutputName,
  downloadBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "@/lib/convert-to-png";

export type ConvertToPngLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string, width: number, height: number) => string;
  convertAndDownload: string;
  converting: string;
  convertingProgress: string;
  invalidFile: string;
  replaceImage: string;
};

export type ConvertToPngProps = {
  labels: ConvertToPngLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

export function ConvertToPNG({ labels, className, onDownload }: ConvertToPngProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

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
      if (!isAcceptedImageFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setProgress(0);
      revokeObjectUrl();

      try {
        const url = await loadImageFileForCrop(file);
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

  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

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

  const handleConvertAndDownload = async () => {
    if (!sourceFile || !imageSrc || busy) return;

    setBusy(true);
    setError("");
    startProgress();

    try {
      const blob = await convertImageToPngBlob(imageSrc);
      const filename = convertToPngOutputName(sourceFile.name);
      stopProgress();
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      stopProgress();
      setProgress(0);
      setError(labels.invalidFile);
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <div className={clsx("crop-image-tool", className)}>
      {!imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "WEBP", "HEIC", "GIF"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="crop-image-tool__workspace">
          <p className="crop-image-tool__instructions">{labels.convertInstructions}</p>

          <div className="crop-image-tool__stage crop-image-tool__stage--preview">
            <img
              src={imageSrc}
              alt=""
              className="crop-image-tool__img"
              draggable={false}
              onLoad={onImageLoad}
            />
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
              onClick={() => void handleConvertAndDownload()}
              disabled={busy || !naturalSize}
            >
              {busy ? labels.converting : labels.convertAndDownload}
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
