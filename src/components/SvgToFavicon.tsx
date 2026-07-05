"use client";

import { clsx } from "clsx";
import { Download, Loader2, Lock, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from "react";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { SvgToFaviconSizePreview } from "@/components/SvgToFaviconSizePreview";
import { SvgToFaviconMobilePreview } from "@/components/SvgToFaviconMobilePreview";
import { SvgToFaviconContrastChecker } from "@/components/SvgToFaviconContrastChecker";
import { SvgToFaviconHeaderCode } from "@/components/SvgToFaviconHeaderCode";
import { imBtnCta } from "@/lib/design-system";
import {
  convertSvgImageToIco,
  detectSmartIconSizes,
  downloadBlob,
  isAcceptedSvgFile,
  loadSvgPreviewUrl,
  readSvgFileText,
  svgToFaviconOutputName,
} from "@/lib/svg-to-favicon";

export type SvgToFaviconLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  convertInstructions: string;
  formatFileInfo: (name: string) => string;
  previewLabel: string;
  sizePreviewTitle: string;
  sizePreviewHint: string;
  sizePreviewSize: (size: number) => string;
  smartScalingActive: string;
  mobilePreviewTitle: string;
  mobilePreviewHint: string;
  desktopTabLabel: string;
  iosTabSwitcherLabel: string;
  androidTabSwitcherLabel: string;
  defaultSiteTitle: string;
  inactiveTabLabel: string;
  contrastTitle: string;
  contrastHint: string;
  contrastChecking: string;
  contrastPass: (ratio: string) => string;
  contrastWarning: (ratio: string) => string;
  contrastInvalid: string;
  headerCodeTitle: string;
  headerCodeHint: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
  privacyProcessing: string;
  privacyComplete: string;
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

type PrivacyStatus = "idle" | "processing" | "success";

export function SvgToFavicon({ labels, className, onDownload }: SvgToFaviconProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [svgSrc, setSvgSrc] = useState<string | null>(null);
  const [svgText, setSvgText] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>("idle");
  const [headerCodeFilename, setHeaderCodeFilename] = useState<string | null>(null);

  const smartSizes = useMemo(() => {
    if (!svgText) return [];
    return detectSmartIconSizes(svgText, naturalSize);
  }, [svgText, naturalSize]);

  const sizePreviewLabels = useMemo(
    () => ({
      title: labels.sizePreviewTitle,
      hint: labels.sizePreviewHint,
      sizeLabel: labels.sizePreviewSize,
      smartScalingActive: labels.smartScalingActive,
    }),
    [labels],
  );

  const mobilePreviewLabels = useMemo(
    () => ({
      mobilePreviewTitle: labels.mobilePreviewTitle,
      mobilePreviewHint: labels.mobilePreviewHint,
      desktopTabLabel: labels.desktopTabLabel,
      iosTabSwitcherLabel: labels.iosTabSwitcherLabel,
      androidTabSwitcherLabel: labels.androidTabSwitcherLabel,
      defaultSiteTitle: labels.defaultSiteTitle,
      inactiveTabLabel: labels.inactiveTabLabel,
    }),
    [labels],
  );

  const contrastLabels = useMemo(
    () => ({
      contrastTitle: labels.contrastTitle,
      contrastHint: labels.contrastHint,
      contrastChecking: labels.contrastChecking,
      contrastPass: labels.contrastPass,
      contrastWarning: labels.contrastWarning,
      contrastInvalid: labels.contrastInvalid,
    }),
    [labels],
  );

  const headerCodeLabels = useMemo(
    () => ({
      title: labels.headerCodeTitle,
      hint: labels.headerCodeHint,
      copyHtmlCode: labels.copyHtmlCode,
      copiedHtmlCode: labels.copiedHtmlCode,
      copyHtmlCodeFailed: labels.copyHtmlCodeFailed,
    }),
    [labels],
  );

  const siteTitle = useMemo(() => {
    if (!sourceFile) return labels.defaultSiteTitle;
    const base = sourceFile.name.replace(/\.[^.]+$/, "").trim();
    return base || labels.defaultSiteTitle;
  }, [sourceFile, labels.defaultSiteTitle]);

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
    setSvgText(null);
    setNaturalSize(null);
    setProgress(0);
    setError("");
    setPrivacyStatus("idle");
    setHeaderCodeFilename(null);
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
      setPrivacyStatus("idle");
      setHeaderCodeFilename(null);
      revokeObjectUrl();

      try {
        const [url, text] = await Promise.all([loadSvgPreviewUrl(file), readSvgFileText(file)]);
        objectUrlRef.current = url;
        setSourceFile(file);
        setSvgSrc(url);
        setSvgText(text);
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
    if (!sourceFile || !svgSrc || !smartSizes.length || busy) return;

    setBusy(true);
    setError("");
    setPrivacyStatus("processing");
    startProgress();

    try {
      const blob = await convertSvgImageToIco(svgSrc, smartSizes);
      const filename = svgToFaviconOutputName(sourceFile.name);
      stopProgress();
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
      setHeaderCodeFilename(filename);
      setPrivacyStatus("success");
    } catch {
      stopProgress();
      setProgress(0);
      setPrivacyStatus("idle");
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

            {naturalSize && smartSizes.length ? (
              <SvgToFaviconSizePreview
                imageSrc={svgSrc}
                sizes={smartSizes}
                labels={sizePreviewLabels}
              />
            ) : null}
          </div>

          {naturalSize && svgSrc ? (
            <SvgToFaviconMobilePreview
              imageSrc={svgSrc}
              siteTitle={siteTitle}
              labels={mobilePreviewLabels}
            />
          ) : null}

          {naturalSize && svgSrc ? (
            <SvgToFaviconContrastChecker imageSrc={svgSrc} labels={contrastLabels} />
          ) : null}

          {busy ? (
            <WorkspaceProgressBar percent={progress} label={labels.convertingProgress} />
          ) : null}

          {privacyStatus !== "idle" ? (
            <p
              className={clsx(
                "svg-to-favicon-tool__privacy-badge",
                privacyStatus === "processing" && "svg-to-favicon-tool__privacy-badge--processing",
                privacyStatus === "success" && "svg-to-favicon-tool__privacy-badge--success",
              )}
              role="status"
              aria-live="polite"
            >
              {privacyStatus === "processing" ? (
                <>
                  <Loader2
                    className="svg-to-favicon-tool__privacy-badge-icon svg-to-favicon-tool__privacy-badge-icon--spin"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{labels.privacyProcessing}</span>
                </>
              ) : (
                <>
                  <Lock className="svg-to-favicon-tool__privacy-badge-icon" strokeWidth={2} aria-hidden />
                  <span>{labels.privacyComplete}</span>
                </>
              )}
            </p>
          ) : null}

          {headerCodeFilename && privacyStatus === "success" ? (
            <SvgToFaviconHeaderCode outputFilename={headerCodeFilename} labels={headerCodeLabels} />
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
              disabled={busy || !naturalSize || !smartSizes.length}
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
