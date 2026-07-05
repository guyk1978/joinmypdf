"use client";

import { clsx } from "clsx";
import { Download, Shield, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type SyntheticEvent } from "react";
import {
  AppleTouchIconHeaderCode,
  type AppleTouchIconHeaderCodeLabels,
} from "@/components/AppleTouchIconHeaderCode";
import {
  AppleTouchIconHomeScreenPreview,
  type AppleTouchIconHomeScreenPreviewLabels,
} from "@/components/AppleTouchIconHomeScreenPreview";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import {
  AppleTouchIconRetinaQuality,
  type AppleTouchIconRetinaQualityLabels,
} from "@/components/AppleTouchIconRetinaQuality";
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
  iosPreview: AppleTouchIconHomeScreenPreviewLabels;
  downloadAppleIcon: string;
  generating: string;
  generatingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceImage: string;
  privacyShieldMessage: string;
  retinaQuality: AppleTouchIconRetinaQualityLabels;
  headerCode: AppleTouchIconHeaderCodeLabels;
};

export type AppleTouchIconProps = {
  labels: AppleTouchIconLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
};

const ACCEPT = "image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg";
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
  const [showPrivacyShield, setShowPrivacyShield] = useState(false);
  const [showHeaderCode, setShowHeaderCode] = useState(false);
  const [headerCodeFilename, setHeaderCodeFilename] = useState<string | null>(null);
  const [headerCodeSizes, setHeaderCodeSizes] = useState<AppleTouchIconSize[]>(DEFAULT_SELECTED);

  const siteTitle = useMemo(() => {
    if (!sourceFile) return labels.iosPreview.defaultSiteTitle;
    const base = sourceFile.name.replace(/\.[^.]+$/, "").trim();
    return base || labels.iosPreview.defaultSiteTitle;
  }, [sourceFile, labels.iosPreview.defaultSiteTitle]);

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
    setShowPrivacyShield(false);
    setShowHeaderCode(false);
    setHeaderCodeFilename(null);
    setHeaderCodeSizes(DEFAULT_SELECTED);
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
      setShowPrivacyShield(false);
      setShowHeaderCode(false);
      setHeaderCodeFilename(null);
      if (inputRef.current) inputRef.current.value = "";
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
    if (!imageSrc) return;

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
  }, [imageSrc, effectiveBackground, revokePreviewUrl]);

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
      setShowPrivacyShield(true);
      setHeaderCodeFilename(filename);
      setHeaderCodeSizes([...selectedSizes]);
      setShowHeaderCode(true);
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

              {naturalSize ? (
                <AppleTouchIconRetinaQuality
                  width={naturalSize.width}
                  height={naturalSize.height}
                  labels={labels.retinaQuality}
                />
              ) : null}
            </div>
          </div>

          <img
            src={imageSrc}
            alt=""
            className="sr-only"
            draggable={false}
            onLoad={onImageLoad}
            aria-hidden
          />

          <AppleTouchIconHomeScreenPreview
            imageSrc={imageSrc}
            previewUrl={previewUrl}
            siteTitle={siteTitle}
            labels={labels.iosPreview}
          />

          {sourceFile && naturalSize ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
            </p>
          ) : null}

          {busy ? <WorkspaceProgressBar percent={progress} label={labels.generatingProgress} /> : null}

          {showPrivacyShield ? (
            <p
              className="apple-touch-icon-tool__privacy-shield"
              role="status"
              aria-live="polite"
            >
              <Shield className="apple-touch-icon-tool__privacy-shield-icon" strokeWidth={2} aria-hidden />
              <span>{labels.privacyShieldMessage}</span>
            </p>
          ) : null}

          {showHeaderCode && headerCodeFilename ? (
            <AppleTouchIconHeaderCode
              outputFilename={headerCodeFilename}
              selectedSizes={headerCodeSizes}
              labels={labels.headerCode}
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
