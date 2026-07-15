"use client";

import { clsx } from "clsx";
import { Check, Copy, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { createImage } from "@/lib/crop-image";
import { imBtnCta } from "@/lib/design-system";
import {
  buildFaviconGeneratorHeaderSnippet,
  buildFaviconIcoFromImage,
  buildFaviconPngZipFromImage,
  downloadBlob,
  FAVICON_GENERATOR_SIZES,
  faviconGeneratorOutputName,
  isAcceptedFaviconGeneratorFile,
  loadFaviconGeneratorSource,
  type FaviconOutputMode,
} from "@/lib/favicon-generator";
import { drawImageToSquareCanvas } from "@/lib/png-to-ico";
import { copyTextToClipboard } from "@/lib/color-converter";

export type FaviconGeneratorLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  settingsTitle: string;
  previewTitle: string;
  tabPreviewLabel: string;
  sizesTitle: string;
  sizeHint: string;
  outputTitle: string;
  outputIco: string;
  outputIcoHint: string;
  outputPng: string;
  outputPngHint: string;
  letterboxLabel: string;
  letterboxHint: string;
  generateDownload: string;
  generating: string;
  replaceImage: string;
  privacyLabel: string;
  invalidFile: string;
  errorGeneric: string;
  successHint: string;
  siteTitleLabel: string;
  siteTitlePlaceholder: string;
  defaultSiteTitle: string;
  headerCodeTitle: string;
  headerCodeHint: string;
  copyHeaderCode: string;
  copiedHeaderCode: string;
  copyFailed: string;
  pageTitle: string;
};

type FaviconGeneratorProps = {
  labels: FaviconGeneratorLabels;
  className?: string;
};

const ACCEPT = "image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg";

function SizePreview({
  imageSrc,
  size,
  letterbox,
}: {
  imageSrc: string;
  size: number;
  letterbox: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void createImage(imageSrc).then((image) => {
      if (cancelled || !canvasRef.current) return;
      const square = drawImageToSquareCanvas(image, size, {
        letterboxPadding: letterbox,
        letterboxFill: "transparent",
      });
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      canvasRef.current.width = size;
      canvasRef.current.height = size;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(square, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [imageSrc, size, letterbox]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="favicon-generator__size-canvas"
      aria-hidden
    />
  );
}

function TabPreview({
  imageSrc,
  title,
  label,
  letterbox,
}: {
  imageSrc: string;
  title: string;
  label: string;
  letterbox: boolean;
}) {
  return (
    <div className="favicon-generator__tab-chrome" aria-label={label}>
      <div className="favicon-generator__tab favicon-generator__tab--active">
        <SizePreview imageSrc={imageSrc} size={16} letterbox={letterbox} />
        <span className="favicon-generator__tab-title">{title}</span>
        <span className="favicon-generator__tab-close" aria-hidden />
      </div>
      <div className="favicon-generator__tab favicon-generator__tab--idle">
        <span className="favicon-generator__tab-title favicon-generator__tab-title--muted">…</span>
      </div>
    </div>
  );
}

export function FaviconGenerator({ labels, className }: FaviconGeneratorProps) {
  const siteTitleId = useId();
  const snippetId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState(labels.defaultSiteTitle);
  const [mode, setMode] = useState<FaviconOutputMode>("ico");
  const [letterbox, setLetterbox] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageSrc(null);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
    setBusy(false);
    setCompleted(false);
    setCopied(false);
    revoke();
  }, [revoke]);

  const loadFile = async (next: File) => {
    if (!isAcceptedFaviconGeneratorFile(next)) {
      setError(labels.invalidFile);
      return;
    }
    revoke();
    setBusy(true);
    setError(null);
    setCompleted(false);
    try {
      const src = await loadFaviconGeneratorSource(next);
      objectUrlRef.current = src;
      setImageSrc(src);
      setFile(next);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming || []);
    const accepted = list.find(isAcceptedFaviconGeneratorFile) ?? list[0];
    if (!accepted) {
      setError(labels.invalidFile);
      return;
    }
    void loadFile(accepted);
  };

  const onGenerate = async () => {
    if (!imageSrc || !file) return;
    setBusy(true);
    setError(null);
    try {
      const blob =
        mode === "ico"
          ? await buildFaviconIcoFromImage(imageSrc, { letterbox })
          : await buildFaviconPngZipFromImage(imageSrc, { letterbox });
      downloadBlob(blob, faviconGeneratorOutputName(file.name, mode));
      setCompleted(true);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const onCopySnippet = async () => {
    const ok = await copyTextToClipboard(buildFaviconGeneratorHeaderSnippet(mode));
    if (!ok) {
      setError(labels.copyFailed);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const displayTitle = siteTitle.trim() || labels.defaultSiteTitle;

  return (
    <div className={clsx("favicon-generator", className)}>
      {!file || !imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["PNG", "JPG", "SVG"]}
          privacyLabel={labels.privacyLabel}
          accept={ACCEPT}
          disabled={busy}
          onFiles={onFiles}
        />
      ) : (
        <div className="favicon-generator__layout">
          <aside className="favicon-generator__preview">
            <h2 className="favicon-generator__section-title">{labels.previewTitle}</h2>
            <p className="favicon-generator__hint">{labels.tabPreviewLabel}</p>
            <TabPreview
              imageSrc={imageSrc}
              title={displayTitle}
              label={labels.tabPreviewLabel}
              letterbox={letterbox}
            />

            <div className="favicon-generator__sizes">
              <p className="favicon-generator__label">{labels.sizesTitle}</p>
              <p className="favicon-generator__hint">{labels.sizeHint}</p>
              <ul className="favicon-generator__size-list">
                {FAVICON_GENERATOR_SIZES.map((size) => (
                  <li key={size} className="favicon-generator__size-item">
                    <SizePreview imageSrc={imageSrc} size={size} letterbox={letterbox} />
                    <span>
                      {size}×{size}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button type="button" className="favicon-generator__link-btn" onClick={reset}>
              {labels.replaceImage}
            </button>
          </aside>

          <section className="favicon-generator__panel">
            <h2 className="favicon-generator__section-title">{labels.settingsTitle}</h2>

            <div className="favicon-generator__field">
              <label htmlFor={siteTitleId}>{labels.siteTitleLabel}</label>
              <input
                id={siteTitleId}
                type="text"
                value={siteTitle}
                maxLength={48}
                placeholder={labels.siteTitlePlaceholder}
                className="favicon-generator__input"
                onChange={(event) => setSiteTitle(event.target.value)}
              />
            </div>

            <div className="favicon-generator__field">
              <p className="favicon-generator__label">{labels.outputTitle}</p>
              <div className="favicon-generator__modes" role="group" aria-label={labels.outputTitle}>
                <button
                  type="button"
                  className={clsx(
                    "favicon-generator__mode",
                    mode === "ico" && "favicon-generator__mode--active",
                  )}
                  onClick={() => setMode("ico")}
                  disabled={busy}
                >
                  <span>{labels.outputIco}</span>
                  <small>{labels.outputIcoHint}</small>
                </button>
                <button
                  type="button"
                  className={clsx(
                    "favicon-generator__mode",
                    mode === "png-zip" && "favicon-generator__mode--active",
                  )}
                  onClick={() => setMode("png-zip")}
                  disabled={busy}
                >
                  <span>{labels.outputPng}</span>
                  <small>{labels.outputPngHint}</small>
                </button>
              </div>
            </div>

            <label className="favicon-generator__check">
              <input
                type="checkbox"
                checked={letterbox}
                disabled={busy}
                onChange={(event) => setLetterbox(event.target.checked)}
              />
              <span>
                <strong>{labels.letterboxLabel}</strong>
                <small>{labels.letterboxHint}</small>
              </span>
            </label>

            {error ? <p className="favicon-generator__error">{error}</p> : null}

            <div className="favicon-generator__actions">
              <button
                type="button"
                className={clsx(imBtnCta, "favicon-generator__primary")}
                disabled={busy}
                onClick={() => void onGenerate()}
              >
                {busy ? (
                  <>
                    <Loader2 className="favicon-generator__spinner" aria-hidden />
                    {labels.generating}
                  </>
                ) : (
                  labels.generateDownload
                )}
              </button>
            </div>

            <div className="favicon-generator__snippet">
              <h3 className="favicon-generator__section-title">{labels.headerCodeTitle}</h3>
              <p className="favicon-generator__hint">{labels.headerCodeHint}</p>
              <pre id={snippetId} className="favicon-generator__code">
                {buildFaviconGeneratorHeaderSnippet(mode)}
              </pre>
              <button type="button" className="favicon-generator__copy" onClick={() => void onCopySnippet()}>
                {copied ? (
                  <>
                    <Check size={14} aria-hidden />
                    {labels.copiedHeaderCode}
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden />
                    {labels.copyHeaderCode}
                  </>
                )}
              </button>
            </div>

            {completed ? (
              <>
                <p className="favicon-generator__success">{labels.successHint}</p>
                <ToolSuccessEngagement
                  pageTitle={labels.pageTitle}
                  fileContext={file.name}
                  className="favicon-generator__engagement"
                />
              </>
            ) : null}

            <p className="favicon-generator__privacy">{labels.privacyLabel}</p>
          </section>
        </div>
      )}
    </div>
  );
}
