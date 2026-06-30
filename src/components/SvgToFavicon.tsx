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
  convertSvgImageToIco,
  downloadBlob,
  drawSvgToSquareCanvas,
  isAcceptedSvgFile,
  loadSvgPreviewUrl,
  SVG_FAVICON_SIZE_OPTIONS,
  svgToFaviconOutputName,
  type SvgFaviconOutputSize,
} from "@/lib/svg-to-favicon";
import { createImage } from "@/lib/crop-image";

export type SvgToFaviconLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string) => string;
  sizeLabel: string;
  formatSizeOption: (size: number) => string;
  previewLabel: string;
  previewFaviconLabel: string;
  downloadFavicon: string;
  converting: string;
  convertingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceFile: string;
};

export type SvgToFaviconProps = {
  labels: SvgToFaviconLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/svg+xml,.svg";

export function SvgToFavicon({ labels, className, onDownload }: SvgToFaviconProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const faviconPreviewRef = useRef<HTMLCanvasElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [svgSrc, setSvgSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [outputSize, setOutputSize] = useState<SvgFaviconOutputSize>(48);
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
    setSvgSrc(null);
    setNaturalSize(null);
    setOutputSize(48);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedSvgFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setProgress(0);
      revokeObjectUrl();

      try {
        const url = await loadSvgPreviewUrl(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setSvgSrc(url);
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

  const onSvgLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalSize({
      width: Math.max(1, img.naturalWidth || img.width),
      height: Math.max(1, img.naturalHeight || img.height),
    });
  };

  useEffect(() => {
    if (!svgSrc || !naturalSize) return;
    const canvas = faviconPreviewRef.current;
    if (!canvas) return;

    let cancelled = false;
    void createImage(svgSrc).then((image) => {
      if (cancelled) return;
      const square = drawSvgToSquareCanvas(image, outputSize);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = outputSize;
      canvas.height = outputSize;
      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.drawImage(square, 0, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [svgSrc, naturalSize, outputSize]);

  const startProgress = () => {
    setProgress(10);
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? current : current + 9));
    }, 110);
  };

  const stopProgress = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
  };

  const handleDownloadFavicon = async () => {
    if (!sourceFile || !svgSrc || busy) return;

    setBusy(true);
    setError("");
    startProgress();

    try {
      const blob = await convertSvgImageToIco(svgSrc, outputSize);
      const filename = svgToFaviconOutputName(sourceFile.name);
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
    <div className={clsx("crop-image-tool svg-to-favicon-tool", className)}>
      {!svgSrc ? (
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

          {sourceFile ? (
            <p className="crop-image-tool__meta">{labels.formatFileInfo(sourceFile.name)}</p>
          ) : null}

          <div className="svg-to-favicon-tool__layout">
            <div className="svg-to-favicon-tool__source tool-workspace-panel">
              <p className="svg-to-favicon-tool__section-label">{labels.previewLabel}</p>
              <div className="svg-to-favicon-tool__source-stage">
                <img
                  src={svgSrc}
                  alt=""
                  className="svg-to-favicon-tool__source-image"
                  draggable={false}
                  onLoad={onSvgLoad}
                />
              </div>
            </div>

            <div className="svg-to-favicon-tool__controls tool-workspace-panel">
              <div className="svg-to-favicon-tool__field">
                <span className="svg-to-favicon-tool__section-label" id="svg-favicon-size-label">
                  {labels.sizeLabel}
                </span>
                <div
                  className="svg-to-favicon-tool__size-row"
                  role="radiogroup"
                  aria-labelledby="svg-favicon-size-label"
                >
                  {SVG_FAVICON_SIZE_OPTIONS.map((size) => (
                    <label key={size} className="svg-to-favicon-tool__size-option">
                      <input
                        type="radio"
                        name="svg-favicon-size"
                        value={size}
                        checked={outputSize === size}
                        onChange={() => setOutputSize(size)}
                      />
                      <span>{labels.formatSizeOption(size)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="svg-to-favicon-tool__favicon-preview">
                <p className="svg-to-favicon-tool__section-label">{labels.previewFaviconLabel}</p>
                <div className="svg-to-favicon-tool__favicon-canvas-wrap">
                  <canvas
                    ref={faviconPreviewRef}
                    width={outputSize}
                    height={outputSize}
                    className="svg-to-favicon-tool__favicon-canvas"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>

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
              {labels.replaceFile}
            </button>
            <button
              type="button"
              className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
              onClick={() => void handleDownloadFavicon()}
              disabled={busy || !naturalSize}
            >
              <Download className="h-4 w-4" aria-hidden />
              {busy ? labels.converting : labels.downloadFavicon}
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
