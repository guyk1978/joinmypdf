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
  buildFaviconPackZip,
  downloadBlob,
  FAVICON_PACK_PNG_ENTRIES,
  faviconPackOutputName,
  isAcceptedFaviconPackFile,
  loadFaviconPackPreview,
} from "@/lib/favicon-pack";

export type FaviconPackLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string, width: number, height: number) => string;
  includesLabel: string;
  includesIco: string;
  sizeLabel: (key: string) => string;
  downloadPack: string;
  generating: string;
  generatingProgress: string;
  zippingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceImage: string;
};

export type FaviconPackProps = {
  labels: FaviconPackLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";

export function FaviconPack({ labels, className, onDownload }: FaviconPackProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
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
    };
  }, [revokeObjectUrl]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setProgress(0);
    setStatusMessage("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFaviconPackFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setProgress(0);
      setStatusMessage("");
      revokeObjectUrl();

      try {
        const url = await loadFaviconPackPreview(file);
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
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const handleDownloadPack = async () => {
    if (!sourceFile || !imageSrc || busy) return;

    setBusy(true);
    setError("");
    setProgress(4);
    setStatusMessage(labels.generating);

    try {
      const blob = await buildFaviconPackZip(imageSrc, ({ percent, stage }) => {
        setProgress(percent);
        setStatusMessage(stage === "zipping" ? labels.zippingProgress : labels.generatingProgress);
      });
      const filename = faviconPackOutputName(sourceFile.name);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setProgress(0);
      setStatusMessage("");
      setError(labels.convertFailed);
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        setProgress(0);
        setStatusMessage("");
      }, 800);
    }
  };

  return (
    <div className={clsx("crop-image-tool favicon-pack-tool", className)}>
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

          <div className="favicon-pack-tool__layout">
            <div className="crop-image-tool__stage crop-image-tool__stage--preview favicon-pack-tool__preview">
              <img
                src={imageSrc}
                alt=""
                className="crop-image-tool__img"
                draggable={false}
                onLoad={onImageLoad}
              />
            </div>

            <div className="favicon-pack-tool__includes tool-workspace-panel">
              <p className="favicon-pack-tool__section-label">{labels.includesLabel}</p>
              <ul className="favicon-pack-tool__file-list">
                <li>{labels.includesIco}</li>
                {FAVICON_PACK_PNG_ENTRIES.map((entry) => (
                  <li key={entry.filename}>
                    {entry.filename}{" "}
                    <span className="favicon-pack-tool__file-meta">
                      ({labels.sizeLabel(entry.labelKey)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {sourceFile && naturalSize ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
            </p>
          ) : null}

          {busy ? (
            <WorkspaceProgressBar
              percent={progress}
              label={statusMessage || labels.generatingProgress}
            />
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
              onClick={() => void handleDownloadPack()}
              disabled={busy || !naturalSize}
            >
              <Download className="h-4 w-4" aria-hidden />
              {busy ? labels.generating : labels.downloadPack}
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
