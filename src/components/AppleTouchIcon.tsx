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
  APPLE_TOUCH_ICON_SIZES,
  appleTouchIconOutputName,
  DEFAULT_APPLE_TOUCH_BACKGROUND,
  downloadBlob,
  exportAppleTouchIcons,
  isAcceptedAppleTouchImageFile,
  loadAppleTouchPreview,
  renderAppleTouchPreviewUrl,
  type AppleTouchIconSize,
} from "@/lib/apple-touch-icon";

export type AppleTouchIconLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string, width: number, height: number) => string;
  sizesLabel: string;
  formatSizeOption: (key: string) => string;
  backgroundLabel: string;
  transparentBackground: string;
  iosPreviewLabel: string;
  downloadAppleIcon: string;
  generating: string;
  generatingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceImage: string;
};

export type AppleTouchIconProps = {
  labels: AppleTouchIconLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";
const DEFAULT_SELECTED: AppleTouchIconSize[] = [180];

export function AppleTouchIcon({ labels, className, onDownload }: AppleTouchIconProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<AppleTouchIconSize[]>(DEFAULT_SELECTED);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_APPLE_TOUCH_BACKGROUND);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl();
      revokePreviewUrl();
    };
  }, [revokeObjectUrl, revokePreviewUrl]);

  const reset = useCallback(() => {
    revokeObjectUrl();
    revokePreviewUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setSelectedSizes(DEFAULT_SELECTED);
    setBackgroundColor(DEFAULT_APPLE_TOUCH_BACKGROUND);
    setTransparentBackground(false);
    setPreviewUrl(null);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeObjectUrl, revokePreviewUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedAppleTouchImageFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      setProgress(0);
      revokeObjectUrl();
      revokePreviewUrl();

      try {
        const url = await loadAppleTouchPreview(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
        setPreviewUrl(null);
      } catch {
        setError(labels.invalidFile);
      }
    },
    [labels.invalidFile, revokeObjectUrl, revokePreviewUrl],
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

  const effectiveBackground = transparentBackground ? null : backgroundColor;

  useEffect(() => {
    if (!imageSrc || !naturalSize) return;

    let cancelled = false;
    void renderAppleTouchPreviewUrl(imageSrc, 180, effectiveBackground).then((url) => {
      if (cancelled) return;
      revokePreviewUrl();
      previewUrlRef.current = url;
      setPreviewUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, naturalSize, effectiveBackground, revokePreviewUrl]);

  const toggleSize = (size: AppleTouchIconSize) => {
    setSelectedSizes((current) => {
      if (current.includes(size)) {
        if (size === 180 && current.length === 1) return current;
        return current.filter((value) => value !== size);
      }
      return [...current, size].sort((a, b) => b - a);
    });
  };

  const handleDownload = async () => {
    if (!sourceFile || !imageSrc || busy || !selectedSizes.length) return;

    setBusy(true);
    setError("");
    setProgress(20);

    try {
      const { blob, multiple } = await exportAppleTouchIcons(
        imageSrc,
        selectedSizes,
        effectiveBackground,
      );
      setProgress(100);
      const filename = appleTouchIconOutputName(sourceFile.name, multiple);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
    } catch {
      setProgress(0);
      setError(labels.convertFailed);
    } finally {
      setBusy(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <div className={clsx("crop-image-tool apple-touch-icon-tool", className)}>
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

          <div className="apple-touch-icon-tool__layout">
            <div className="apple-touch-icon-tool__controls tool-workspace-panel">
              <div className="apple-touch-icon-tool__field">
                <span className="apple-touch-icon-tool__section-label" id="apple-touch-sizes-label">
                  {labels.sizesLabel}
                </span>
                <div
                  className="apple-touch-icon-tool__size-row"
                  role="group"
                  aria-labelledby="apple-touch-sizes-label"
                >
                  {APPLE_TOUCH_ICON_SIZES.map((entry) => (
                    <label key={entry.size} className="apple-touch-icon-tool__size-option">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(entry.size)}
                        onChange={() => toggleSize(entry.size)}
                      />
                      <span>{labels.formatSizeOption(entry.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="apple-touch-icon-tool__field">
                <span className="apple-touch-icon-tool__section-label">{labels.backgroundLabel}</span>
                <label className="apple-touch-icon-tool__transparent-option">
                  <input
                    type="checkbox"
                    checked={transparentBackground}
                    onChange={(event) => setTransparentBackground(event.target.checked)}
                  />
                  <span>{labels.transparentBackground}</span>
                </label>
                {!transparentBackground ? (
                  <div className="apple-touch-icon-tool__color-row">
                    <input
                      type="color"
                      className="apple-touch-icon-tool__color-input"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      aria-label={labels.backgroundLabel}
                    />
                    <input
                      type="text"
                      className="apple-touch-icon-tool__hex-input"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      spellCheck={false}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="apple-touch-icon-tool__preview tool-workspace-panel">
              <p className="apple-touch-icon-tool__section-label">{labels.iosPreviewLabel}</p>
              <div className="apple-touch-icon-tool__ios-shell">
                <div className="apple-touch-icon-tool__ios-icon">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="apple-touch-icon-tool__ios-image" draggable={false} />
                  ) : (
                    <img
                      src={imageSrc}
                      alt=""
                      className="apple-touch-icon-tool__ios-image"
                      draggable={false}
                      onLoad={onImageLoad}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {sourceFile && naturalSize ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
            </p>
          ) : null}

          {busy ? <WorkspaceProgressBar percent={progress} label={labels.generatingProgress} /> : null}

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
              disabled={busy || !naturalSize || !selectedSizes.length}
            >
              <Download className="h-4 w-4" aria-hidden />
              {busy ? labels.generating : labels.downloadAppleIcon}
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
