"use client";

import { clsx } from "clsx";
import {
  FlipHorizontal2,
  FlipVertical2,
  Loader2,
  RotateCcw,
  RotateCw,
  ScanLine,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { useToolFeedback } from "@/context/ToolFeedbackContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { Link } from "@/i18n/navigation";
import { imBtnCta } from "@/lib/design-system";
import { detectDeskewAngle } from "@/lib/deskew-image";
import {
  downloadBlob,
  getTransformedImageBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
  normalizeDegrees,
  rotateImageOutputName,
} from "@/lib/rotate-image";

export type RotateImageLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  rotateInstructions: string;
  toolbarTitle: string;
  quickRotateTitle: string;
  rotateLeft: string;
  rotateRight: string;
  rotate180: string;
  precisionTitle: string;
  precisionLabel: string;
  applyPrecision: string;
  flipTitle: string;
  flipHorizontal: string;
  flipVertical: string;
  autoAlignTitle: string;
  autoAlignButton: string;
  autoAlignBusy: string;
  autoAlignDone: string;
  autoAlignHint: string;
  formatRotation: (degrees: number) => string;
  flipState: (horizontal: boolean, vertical: boolean) => string;
  download: string;
  downloading: string;
  invalidFile: string;
  replaceImage: string;
  suiteLinksTitle: string;
  linkRotatePdf: string;
  linkVideoRotator: string;
  deskewFailed: string;
};

export type RotateImageProps = {
  labels: RotateImageLabels;
  className?: string;
  onDownload?: (blob: Blob, filename: string) => void;
  /** Deep-link helpers for sibling suite entry points. */
  rotatePdfHref?: string;
  videoRotatorHref?: string;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

export function RotateImage({
  labels,
  className,
  onDownload,
  rotatePdfHref = "/tools/rotate-pdf/",
  videoRotatorHref = "/tools/video-rotator/",
}: RotateImageProps) {
  const { headline, slug } = useToolPageShell();
  const { registerFile } = useToolFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const precisionId = useId();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [degrees, setDegrees] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [precisionInput, setPrecisionInput] = useState("0");

  const [busy, setBusy] = useState(false);
  const [deskewing, setDeskewing] = useState(false);
  const [deskewProgress, setDeskewProgress] = useState(0);
  const [deskewNote, setDeskewNote] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeObjectUrl, [revokeObjectUrl]);

  const setAngle = useCallback((next: number) => {
    const normalized = normalizeDegrees(next);
    setDegrees(normalized);
    setPrecisionInput(String(normalized));
    setDeskewNote(null);
  }, []);

  const reset = useCallback(() => {
    revokeObjectUrl();
    setSourceFile(null);
    setImageSrc(null);
    setNaturalSize(null);
    setDegrees(0);
    setFlipX(false);
    setFlipY(false);
    setPrecisionInput("0");
    setError("");
    setDeskewNote(null);
    setDeskewProgress(0);
    setShowFeedback(false);
    registerFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [registerFile, revokeObjectUrl]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        setError(labels.invalidFile);
        return;
      }

      setError("");
      revokeObjectUrl();

      try {
        const url = await loadImageFileForCrop(file);
        objectUrlRef.current = url;
        setSourceFile(file);
        setImageSrc(url);
        setNaturalSize(null);
        setDegrees(0);
        setFlipX(false);
        setFlipY(false);
        setPrecisionInput("0");
        setDeskewNote(null);
        setShowFeedback(false);
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

  const applyPrecision = () => {
    const parsed = Number.parseFloat(precisionInput.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      setPrecisionInput(String(degrees));
      return;
    }
    setAngle(parsed);
  };

  const handlePrecisionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPrecisionInput(event.target.value);
  };

  const handleAutoAlign = async () => {
    if (!imageSrc || deskewing || busy) return;
    setDeskewing(true);
    setDeskewProgress(0);
    setDeskewNote(null);
    setError("");

    try {
      const result = await detectDeskewAngle(imageSrc, {
        onProgress: (progress) => setDeskewProgress(progress.ratio),
      });
      // Keep ±90° snaps; replace any prior micro-deskew with the fresh correction.
      const orthogonal = Math.round(degrees / 90) * 90;
      setAngle(orthogonal + result.angle);
      setDeskewNote(
        labels.autoAlignDone.replace("{degrees}", String(normalizeDegrees(result.angle))),
      );
    } catch {
      setError(labels.deskewFailed);
    } finally {
      setDeskewing(false);
      setDeskewProgress(1);
    }
  };

  const handleDownload = async () => {
    if (!imageSrc || !sourceFile || busy || deskewing) return;

    setBusy(true);
    setError("");

    try {
      const blob = await getTransformedImageBlob(
        imageSrc,
        { degrees, flipX, flipY },
        sourceFile,
      );
      const filename = rotateImageOutputName(sourceFile.name, blob.type);
      downloadBlob(blob, filename);
      onDownload?.(blob, filename);
      registerFile(sourceFile, slug);
      setShowFeedback(true);
    } catch {
      setError(labels.invalidFile);
    } finally {
      setBusy(false);
    }
  };

  const previewTransform = [
    flipX ? "scaleX(-1)" : null,
    flipY ? "scaleY(-1)" : null,
    `rotate(${degrees}deg)`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clsx("rotate-align-suite", className)}>
      {!imageSrc ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG", "WEBP", "GIF", "HEIC"]}
          accept={ACCEPT}
          onFiles={(files) => {
            const file = Array.from(files)[0];
            if (file) void loadFile(file);
          }}
        />
      ) : (
        <div className="rotate-align-suite__layout">
          <aside className="rotate-align-suite__sidebar tool-workspace-panel security-tool__pane">
            <h2 className="security-tool__section-title">{labels.toolbarTitle}</h2>
            <p className="rotate-align-suite__hint">{labels.rotateInstructions}</p>

            <section className="rotate-align-suite__section" aria-labelledby="quick-rotate-title">
              <h3 id="quick-rotate-title" className="rotate-align-suite__section-title">
                {labels.quickRotateTitle}
              </h3>
              <div className="rotate-align-suite__btn-row">
                <button
                  type="button"
                  className="rotate-align-suite__tool-btn"
                  onClick={() => setAngle(degrees - 90)}
                  disabled={busy || deskewing}
                  aria-label={labels.rotateLeft}
                >
                  <RotateCcw strokeWidth={2} aria-hidden />
                  <span>{labels.rotateLeft}</span>
                </button>
                <button
                  type="button"
                  className="rotate-align-suite__tool-btn"
                  onClick={() => setAngle(degrees + 90)}
                  disabled={busy || deskewing}
                  aria-label={labels.rotateRight}
                >
                  <RotateCw strokeWidth={2} aria-hidden />
                  <span>{labels.rotateRight}</span>
                </button>
                <button
                  type="button"
                  className="rotate-align-suite__tool-btn"
                  onClick={() => setAngle(degrees + 180)}
                  disabled={busy || deskewing}
                >
                  <span>{labels.rotate180}</span>
                </button>
              </div>
            </section>

            <section className="rotate-align-suite__section" aria-labelledby="precision-title">
              <h3 id="precision-title" className="rotate-align-suite__section-title">
                {labels.precisionTitle}
              </h3>
              <label className="rotate-align-suite__field" htmlFor={precisionId}>
                <span>{labels.precisionLabel}</span>
                <input
                  id={precisionId}
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min={-180}
                  max={180}
                  value={precisionInput}
                  onChange={handlePrecisionChange}
                  onBlur={applyPrecision}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyPrecision();
                  }}
                  disabled={busy || deskewing}
                  className="rotate-align-suite__number"
                />
              </label>
              <button
                type="button"
                className="rotate-align-suite__tool-btn rotate-align-suite__tool-btn--wide"
                onClick={applyPrecision}
                disabled={busy || deskewing}
              >
                {labels.applyPrecision}
              </button>
            </section>

            <section className="rotate-align-suite__section" aria-labelledby="flip-title">
              <h3 id="flip-title" className="rotate-align-suite__section-title">
                {labels.flipTitle}
              </h3>
              <div className="rotate-align-suite__btn-row">
                <button
                  type="button"
                  className={clsx(
                    "rotate-align-suite__tool-btn",
                    flipX && "rotate-align-suite__tool-btn--active",
                  )}
                  aria-pressed={flipX}
                  onClick={() => {
                    setFlipX((value) => !value);
                    setDeskewNote(null);
                  }}
                  disabled={busy || deskewing}
                >
                  <FlipHorizontal2 strokeWidth={2} aria-hidden />
                  <span>{labels.flipHorizontal}</span>
                </button>
                <button
                  type="button"
                  className={clsx(
                    "rotate-align-suite__tool-btn",
                    flipY && "rotate-align-suite__tool-btn--active",
                  )}
                  aria-pressed={flipY}
                  onClick={() => {
                    setFlipY((value) => !value);
                    setDeskewNote(null);
                  }}
                  disabled={busy || deskewing}
                >
                  <FlipVertical2 strokeWidth={2} aria-hidden />
                  <span>{labels.flipVertical}</span>
                </button>
              </div>
            </section>

            <section className="rotate-align-suite__section" aria-labelledby="auto-align-title">
              <h3 id="auto-align-title" className="rotate-align-suite__section-title">
                {labels.autoAlignTitle}
              </h3>
              <p className="rotate-align-suite__hint">{labels.autoAlignHint}</p>
              <button
                type="button"
                className="rotate-align-suite__tool-btn rotate-align-suite__tool-btn--wide rotate-align-suite__tool-btn--accent"
                onClick={() => void handleAutoAlign()}
                disabled={busy || deskewing}
              >
                {deskewing ? (
                  <Loader2 className="rotate-align-suite__spinner" strokeWidth={2} aria-hidden />
                ) : (
                  <ScanLine strokeWidth={2} aria-hidden />
                )}
                <span>{deskewing ? labels.autoAlignBusy : labels.autoAlignButton}</span>
              </button>
              {deskewing ? (
                <div
                  className="rotate-align-suite__progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(deskewProgress * 100)}
                >
                  <span style={{ width: `${Math.round(deskewProgress * 100)}%` }} />
                </div>
              ) : null}
              {deskewNote ? <p className="rotate-align-suite__note">{deskewNote}</p> : null}
            </section>

            <section className="rotate-align-suite__section" aria-labelledby="suite-links-title">
              <h3 id="suite-links-title" className="rotate-align-suite__section-title">
                {labels.suiteLinksTitle}
              </h3>
              <ul className="rotate-align-suite__links">
                <li>
                  <Link href={rotatePdfHref} className="rotate-align-suite__link" prefetch={false}>
                    {labels.linkRotatePdf}
                  </Link>
                </li>
                <li>
                  <Link href={videoRotatorHref} className="rotate-align-suite__link" prefetch={false}>
                    {labels.linkVideoRotator}
                  </Link>
                </li>
              </ul>
            </section>
          </aside>

          <div className="rotate-align-suite__main tool-workspace-panel security-tool__pane">
            <div className="rotate-align-suite__stage">
              <img
                src={imageSrc}
                alt=""
                className="rotate-align-suite__img"
                style={{ transform: previewTransform }}
                draggable={false}
                onLoad={onImageLoad}
              />
              {deskewing ? (
                <div className="rotate-align-suite__overlay" aria-live="polite">
                  <Loader2 className="rotate-align-suite__spinner" strokeWidth={2} aria-hidden />
                  <span>{labels.autoAlignBusy}</span>
                </div>
              ) : null}
            </div>

            {naturalSize ? (
              <p className="rotate-align-suite__meta">
                {labels.formatRotation(degrees)} · {labels.flipState(flipX, flipY)}
              </p>
            ) : null}

            <div className="rotate-align-suite__actions">
              <button
                type="button"
                className="crop-image-tool__secondary-btn"
                onClick={reset}
                disabled={busy || deskewing}
              >
                {labels.replaceImage}
              </button>
              <button
                type="button"
                className={clsx(imBtnCta, "crop-image-tool__primary-btn")}
                onClick={() => void handleDownload()}
                disabled={busy || deskewing || !naturalSize}
              >
                {busy ? labels.downloading : labels.download}
              </button>
            </div>

            {showFeedback ? (
              <ToolSuccessEngagement
                pageTitle={headline}
                className="rotate-align-suite__engagement"
              />
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <p className="crop-image-tool__error" role="alert">
          {error}
        </p>
      ) : null}

      <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} />
    </div>
  );
}
