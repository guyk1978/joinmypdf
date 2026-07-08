"use client";

import { clsx } from "clsx";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Download, Lock, Maximize2, Shield } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { FaviconPackConsistencyCheck } from "@/components/FaviconPackConsistencyCheck";
import { FaviconPackFormatPreview } from "@/components/FaviconPackFormatPreview";
import { FaviconPackHeaderCode } from "@/components/FaviconPackHeaderCode";
import { FaviconPackSourcePreview } from "@/components/FaviconPackSourcePreview";
import { imBtnCta } from "@/lib/design-system";
import {
  buildFaviconPackZip,
  downloadBlob,
  FAVICON_PACK_PNG_ENTRIES,
  faviconPackOutputName,
  isAcceptedFaviconPackFile,
  loadFaviconPackPreview,
  needsFaviconPackAutoFit,
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
  includesManifest: string;
  sizeLabel: (key: string) => string;
  downloadPack: string;
  generating: string;
  generatingProgress: string;
  zippingProgress: string;
  invalidFile: string;
  convertFailed: string;
  replaceImage: string;
  formatPreviewTitle: string;
  formatPreviewHint: string;
  browserTabLabel: string;
  iosHomeScreenLabel: string;
  androidAppIconLabel: string;
  windowsTaskbarLabel: string;
  defaultSiteTitle: string;
  privacyBadgeWaiting: string;
  privacyBadgeLocal: string;
  autoFitBadge: string;
  autoFitBadgeSquare: string;
  consistencyTitle: string;
  consistencyHint: string;
  consistencyPass: string;
  consistencyWarning: (upscale: string, shortSide: number, recommended: number) => string;
  headerCodeTitle: string;
  headerCodeHint: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
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

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [showHeaderCode, setShowHeaderCode] = useState(false);

  const siteTitle = useMemo(() => {
    if (!sourceFile) return labels.defaultSiteTitle;
    const base = sourceFile.name.replace(/\.[^.]+$/, "").trim();
    return base || labels.defaultSiteTitle;
  }, [sourceFile, labels.defaultSiteTitle]);

  const consistencyLabels = useMemo(
    () => ({
      consistencyTitle: labels.consistencyTitle,
      consistencyHint: labels.consistencyHint,
      consistencyPass: labels.consistencyPass,
      consistencyWarning: labels.consistencyWarning,
    }),
    [labels],
  );

  const formatPreviewLabels = useMemo(
    () => ({
      title: labels.formatPreviewTitle,
      hint: labels.formatPreviewHint,
      browserTabLabel: labels.browserTabLabel,
      iosHomeScreenLabel: labels.iosHomeScreenLabel,
      androidAppIconLabel: labels.androidAppIconLabel,
      windowsTaskbarLabel: labels.windowsTaskbarLabel,
      defaultSiteTitle: labels.defaultSiteTitle,
    }),
    [labels],
  );

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
    setShowHeaderCode(false);
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
      setShowHeaderCode(false);
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

  const onImageDimensions = useCallback((width: number, height: number) => {
    setNaturalSize({ width, height });
  }, []);

  const handleDownloadPack = async () => {
    if (!sourceFile || !imageSrc || busy) return;

    setBusy(true);
    setError("");
    setProgress(4);
    setStatusMessage(labels.generating);

    try {
      const blob = await buildFaviconPackZip(imageSrc, {
        siteTitle,
        onProgress: ({ percent, stage }) => {
          setProgress(percent);
          setStatusMessage(stage === "zipping" ? labels.zippingProgress : labels.generatingProgress);
        },
      });
      const filename = faviconPackOutputName(sourceFile.name);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
      setShowHeaderCode(true);
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

  const isLocallyProcessed = Boolean(imageSrc && naturalSize);
  const showAutoFitBadge = Boolean(naturalSize && needsFaviconPackAutoFit(naturalSize.width, naturalSize.height));

  const autoFitBadge = naturalSize ? (
    <p
      className={clsx(
        "favicon-pack-tool__auto-fit-badge",
        showAutoFitBadge
          ? "favicon-pack-tool__auto-fit-badge--active"
          : "favicon-pack-tool__auto-fit-badge--square",
      )}
      role="status"
    >
      <Maximize2 className="favicon-pack-tool__auto-fit-badge-icon" strokeWidth={2} aria-hidden />
      <span>{showAutoFitBadge ? labels.autoFitBadge : labels.autoFitBadgeSquare}</span>
    </p>
  ) : null;

  const privacyBadge = (
    <p
      className={clsx(
        "favicon-pack-tool__privacy-badge",
        isLocallyProcessed
          ? "favicon-pack-tool__privacy-badge--local"
          : "favicon-pack-tool__privacy-badge--waiting",
      )}
      role="status"
      aria-live="polite"
    >
      {isLocallyProcessed ? (
        <>
          <Lock className="favicon-pack-tool__privacy-badge-icon" strokeWidth={2} aria-hidden />
          <span>{labels.privacyBadgeLocal}</span>
        </>
      ) : (
        <>
          <Shield className="favicon-pack-tool__privacy-badge-icon" strokeWidth={2} aria-hidden />
          <span>{labels.privacyBadgeWaiting}</span>
        </>
      )}
    </p>
  );

  return (
    <div className={clsx("crop-image-tool favicon-pack-tool", className)}>
      {!imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["PNG", "JPG"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="crop-image-tool__workspace">
          <p className="crop-image-tool__instructions">{labels.convertInstructions}</p>

          {privacyBadge}

          {autoFitBadge}

          <div className="favicon-pack-tool__layout">
            <div className="crop-image-tool__stage crop-image-tool__stage--preview favicon-pack-tool__preview">
              <FaviconPackSourcePreview imageSrc={imageSrc} onDimensions={onImageDimensions} />
            </div>

            <div className="favicon-pack-tool__includes tool-workspace-panel">
              <p className="favicon-pack-tool__section-label">{labels.includesLabel}</p>
              <ul className="favicon-pack-tool__file-list">
                <li>{labels.includesIco}</li>
                <li>{labels.includesManifest}</li>
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

          {naturalSize ? (
            <FaviconPackConsistencyCheck
              width={naturalSize.width}
              height={naturalSize.height}
              labels={consistencyLabels}
            />
          ) : null}

          {naturalSize && imageSrc ? (
            <FaviconPackFormatPreview
              imageSrc={imageSrc}
              siteTitle={siteTitle}
              labels={formatPreviewLabels}
            />
          ) : null}

          {sourceFile && naturalSize ? (
            <p className="crop-image-tool__meta">
              {labels.formatFileInfo(sourceFile.name, naturalSize.width, naturalSize.height)}
            </p>
          ) : null}

          {showHeaderCode ? (
            <FaviconPackHeaderCode
              labels={{
                title: labels.headerCodeTitle,
                hint: labels.headerCodeHint,
                copyHtmlCode: labels.copyHtmlCode,
                copiedHtmlCode: labels.copiedHtmlCode,
                copyHtmlCodeFailed: labels.copyHtmlCodeFailed,
              }}
            />
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
