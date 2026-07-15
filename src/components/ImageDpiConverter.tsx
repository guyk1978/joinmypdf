"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Magnifier } from "@/components/Magnifier";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { imBtnCta } from "@/lib/design-system";
import {
  convertImageDpi,
  DPI_PRESETS,
  isDpiConverterImageFile,
  PRINT_READY_DPI,
  readImageDpiInfo,
  type ImageDpiInfo,
} from "@/lib/image-dpi-converter";

export type ImageDpiConverterLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  settingsTitle: string;
  currentDpiLabel: string;
  currentDpiUnknown: string;
  dimensionsLabel: string;
  formatLabel: string;
  formatJpeg: string;
  formatPng: string;
  targetDpiLabel: string;
  customDpiLabel: string;
  presetAria: string;
  printReady: string;
  printReadyHint: string;
  convertDownload: string;
  converting: string;
  replaceImage: string;
  privacyLabel: string;
  invalidFile: string;
  invalidDpi: string;
  errorGeneric: string;
  successHint: string;
  pageTitle: string;
};

type ImageDpiConverterProps = {
  labels: ImageDpiConverterLabels;
  className?: string;
};

const ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function ImageDpiConverter({ labels, className }: ImageDpiConverterProps) {
  const customId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<ImageDpiInfo | null>(null);
  const [targetDpi, setTargetDpi] = useState(PRINT_READY_DPI);
  const [customDpi, setCustomDpi] = useState(String(PRINT_READY_DPI));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setInfo(null);
    setError(null);
    setBusy(false);
    setCompleted(false);
    revokePreview();
  }, [revokePreview]);

  const applyTarget = (dpi: number) => {
    setTargetDpi(dpi);
    setCustomDpi(String(dpi));
  };

  const loadFile = async (next: File) => {
    if (!isDpiConverterImageFile(next)) {
      setError(labels.invalidFile);
      return;
    }

    revokePreview();
    const url = URL.createObjectURL(next);
    previewRef.current = url;
    setPreviewUrl(url);
    setFile(next);
    setInfo(null);
    setCompleted(false);
    setError(null);
    setBusy(true);

    try {
      const dpiInfo = await readImageDpiInfo(next);
      setInfo(dpiInfo);
      if (dpiInfo.dpi != null) {
        applyTarget(dpiInfo.dpi);
      }
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming || []);
    const accepted = list.find(isDpiConverterImageFile) ?? list[0];
    if (!accepted) {
      setError(labels.invalidFile);
      return;
    }
    void loadFile(accepted);
  };

  const onCustomChange = (raw: string) => {
    setCustomDpi(raw);
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setTargetDpi(parsed);
    }
  };

  const onConvert = async () => {
    if (!file) return;
    const parsed = Number.parseInt(customDpi, 10);
    const dpi = Number.isFinite(parsed) && parsed > 0 ? parsed : targetDpi;
    if (!Number.isFinite(dpi) || dpi < 1) {
      setError(labels.invalidDpi);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await convertImageDpi(file, dpi);
      downloadBlob(result.blob, result.fileName);
      setCompleted(true);
      applyTarget(result.dpi);
      // Reflect written density on the local info panel
      setInfo((prev) =>
        prev
          ? { ...prev, dpi: result.dpi, dpiApproximate: false }
          : prev,
      );
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const currentDpiText =
    info?.dpi != null
      ? `${info.dpi} DPI${info.dpiApproximate ? " ≈" : ""}`
      : labels.currentDpiUnknown;

  return (
    <div className={clsx("image-dpi-converter", className)}>
      {!file ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG"]}
          privacyLabel={labels.privacyLabel}
          accept={ACCEPT}
          disabled={busy}
          onFiles={onFiles}
        />
      ) : (
        <div className="image-dpi-converter__layout">
          <aside className="image-dpi-converter__preview">
            {previewUrl ? (
              <Magnifier zoom={2} size={160} shape="rounded">
              {/* Blob preview — next/image is not suitable for object URLs */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={file.name}
                className="image-dpi-converter__img"
              />
              </Magnifier>
            ) : null}
            <p className="image-dpi-converter__filename">{file.name}</p>
            <button type="button" className="image-dpi-converter__link-btn" onClick={reset}>
              {labels.replaceImage}
            </button>
          </aside>

          <section className="image-dpi-converter__panel">
            <h2 className="image-dpi-converter__section-title">{labels.settingsTitle}</h2>

            <dl className="image-dpi-converter__info">
              <div>
                <dt>{labels.currentDpiLabel}</dt>
                <dd>{busy && !info ? "…" : currentDpiText}</dd>
              </div>
              {info ? (
                <>
                  <div>
                    <dt>{labels.dimensionsLabel}</dt>
                    <dd>
                      {info.width} × {info.height} px
                    </dd>
                  </div>
                  <div>
                    <dt>{labels.formatLabel}</dt>
                    <dd>{info.format === "png" ? labels.formatPng : labels.formatJpeg}</dd>
                  </div>
                </>
              ) : null}
            </dl>

            <div className="image-dpi-converter__field">
              <p className="image-dpi-converter__label">{labels.targetDpiLabel}</p>
              <div className="image-dpi-converter__presets" role="group" aria-label={labels.presetAria}>
                {DPI_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={clsx(
                      "image-dpi-converter__preset",
                      targetDpi === preset && "image-dpi-converter__preset--active",
                    )}
                    onClick={() => applyTarget(preset)}
                    disabled={busy}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="image-dpi-converter__print-row">
              <button
                type="button"
                className={clsx(
                  "image-dpi-converter__print-ready",
                  targetDpi === PRINT_READY_DPI && "image-dpi-converter__print-ready--active",
                )}
                onClick={() => applyTarget(PRINT_READY_DPI)}
                disabled={busy}
              >
                {labels.printReady}
              </button>
              <p className="image-dpi-converter__hint">{labels.printReadyHint}</p>
            </div>

            <div className="image-dpi-converter__field">
              <label htmlFor={customId}>{labels.customDpiLabel}</label>
              <input
                id={customId}
                type="number"
                min={1}
                max={9600}
                inputMode="numeric"
                value={customDpi}
                disabled={busy}
                onChange={(event) => onCustomChange(event.target.value)}
                className="image-dpi-converter__input"
              />
            </div>

            {error ? <p className="image-dpi-converter__error">{error}</p> : null}

            <div className="image-dpi-converter__actions">
              <button
                type="button"
                className={clsx(imBtnCta, "image-dpi-converter__primary")}
                disabled={busy || !file}
                onClick={() => void onConvert()}
              >
                {busy ? labels.converting : labels.convertDownload}
              </button>
            </div>

            {completed ? (
              <>
                <p className="image-dpi-converter__success">{labels.successHint}</p>
                <ToolSuccessEngagement
                  pageTitle={labels.pageTitle}
                  fileContext={file.name}
                  className="image-dpi-converter__engagement"
                />
              </>
            ) : null}

            <p className="image-dpi-converter__privacy">{labels.privacyLabel}</p>
          </section>
        </div>
      )}
    </div>
  );
}
