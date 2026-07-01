"use client";

import { useEffect, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  copyCanvasAsPng,
  DEFAULT_QR_FOREGROUND,
  downloadCanvasAsPng,
  isValidHexColor,
  normalizeHexColor,
  QR_FOREGROUND_PRESETS,
  renderQrCodeToCanvas,
  type QrCodeSize,
  type QrErrorCorrection,
} from "@/lib/qr-code-generator";

export type QRCodeGeneratorLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  optionsTitle: string;
  sizeLabel: string;
  sizeSmall: string;
  sizeMedium: string;
  sizeLarge: string;
  errorCorrectionLabel: string;
  errorLow: string;
  errorMedium: string;
  errorHigh: string;
  foregroundColorLabel: string;
  foregroundColorHint: string;
  presetAriaPrefix: string;
  outputTitle: string;
  outputEmpty: string;
  downloadButton: string;
  copyImageButton: string;
  copied: string;
  copyFailed: string;
  generateError: string;
};

type QRCodeGeneratorProps = {
  labels: QRCodeGeneratorLabels;
  className?: string;
};

const SIZE_OPTIONS: { value: QrCodeSize; labelKey: keyof QRCodeGeneratorLabels }[] = [
  { value: "small", labelKey: "sizeSmall" },
  { value: "medium", labelKey: "sizeMedium" },
  { value: "large", labelKey: "sizeLarge" },
];

const ERROR_OPTIONS: { value: QrErrorCorrection; labelKey: keyof QRCodeGeneratorLabels }[] = [
  { value: "low", labelKey: "errorLow" },
  { value: "medium", labelKey: "errorMedium" },
  { value: "high", labelKey: "errorHigh" },
];

export function QRCodeGenerator({ labels, className }: QRCodeGeneratorProps) {
  const inputId = useId();
  const colorId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [content, setContent] = useState("");
  const [size, setSize] = useState<QrCodeSize>("medium");
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrection>("medium");
  const [foregroundColor, setForegroundColor] = useState(DEFAULT_QR_FOREGROUND);
  const [hasOutput, setHasOutput] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = content.trim();
    const canvas = canvasRef.current;

    if (!canvas || !trimmed) {
      setHasOutput(false);
      setRenderError(null);
      const context = canvas?.getContext("2d");
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      void renderQrCodeToCanvas(canvas, trimmed, {
        size,
        errorCorrection,
        foregroundColor: normalizeHexColor(foregroundColor),
      })
        .then(() => {
          setHasOutput(true);
          setRenderError(null);
        })
        .catch(() => {
          setHasOutput(false);
          setRenderError(labels.generateError);
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [content, size, errorCorrection, foregroundColor, labels.generateError]);

  const onForegroundHexChange = (value: string) => {
    setForegroundColor(value);
  };

  const onForegroundHexBlur = () => {
    setForegroundColor((current) => normalizeHexColor(current));
  };

  const onCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasOutput) return;

    const success = await copyCanvasAsPng(canvas);
    if (!success) {
      setCopyError(labels.copyFailed);
      return;
    }

    setCopyError(null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const onDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasOutput) return;
    downloadCanvasAsPng(canvas);
  };

  return (
    <div className={clsx("qr-generator-tool", className)}>
      <section className="qr-generator-tool__controls tool-workspace-panel" aria-labelledby="qr-generator-controls">
        <h2 id="qr-generator-controls" className="qr-generator-tool__section-title">
          {labels.optionsTitle}
        </h2>

        <label className="qr-generator-tool__label" htmlFor={inputId}>
          {labels.inputLabel}
        </label>
        <textarea
          id={inputId}
          className="qr-generator-tool__textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={6}
        />

        <div className="qr-generator-tool__options-grid">
          <div className="qr-generator-tool__field">
            <label className="qr-generator-tool__label" htmlFor="qr-generator-size">
              {labels.sizeLabel}
            </label>
            <select
              id="qr-generator-size"
              className="qr-generator-tool__select"
              value={size}
              onChange={(event) => setSize(event.target.value as QrCodeSize)}
            >
              {SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {labels[option.labelKey]}
                </option>
              ))}
            </select>
          </div>

          <div className="qr-generator-tool__field">
            <label className="qr-generator-tool__label" htmlFor="qr-generator-error">
              {labels.errorCorrectionLabel}
            </label>
            <select
              id="qr-generator-error"
              className="qr-generator-tool__select"
              value={errorCorrection}
              onChange={(event) => setErrorCorrection(event.target.value as QrErrorCorrection)}
            >
              {ERROR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {labels[option.labelKey]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="qr-generator-tool__field">
          <label className="qr-generator-tool__label" htmlFor={colorId}>
            {labels.foregroundColorLabel}
          </label>
          <p className="qr-generator-tool__hint">{labels.foregroundColorHint}</p>
          <div className="qr-generator-tool__color-row">
            <input
              id={colorId}
              type="color"
              className="qr-generator-tool__color-input"
              value={isValidHexColor(foregroundColor) ? normalizeHexColor(foregroundColor) : DEFAULT_QR_FOREGROUND}
              onChange={(event) => setForegroundColor(event.target.value)}
            />
            <input
              type="text"
              className="qr-generator-tool__hex-input"
              value={foregroundColor}
              onChange={(event) => onForegroundHexChange(event.target.value)}
              onBlur={onForegroundHexBlur}
              spellCheck={false}
              aria-label={labels.foregroundColorLabel}
            />
          </div>
          <div className="qr-generator-tool__presets" role="list" aria-label={labels.foregroundColorLabel}>
            {QR_FOREGROUND_PRESETS.map((preset, index) => (
              <button
                key={preset}
                type="button"
                role="listitem"
                className={clsx(
                  "qr-generator-tool__preset",
                  normalizeHexColor(foregroundColor) === preset && "qr-generator-tool__preset--active",
                )}
                style={{ backgroundColor: preset }}
                onClick={() => setForegroundColor(preset)}
                aria-label={`${labels.presetAriaPrefix} ${index + 1}`}
                aria-pressed={normalizeHexColor(foregroundColor) === preset}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="qr-generator-tool__output tool-workspace-panel" aria-labelledby="qr-generator-output">
        <div className="qr-generator-tool__output-header">
          <h2 id="qr-generator-output" className="qr-generator-tool__section-title">
            {labels.outputTitle}
          </h2>
          <div className="qr-generator-tool__actions">
            <button
              type="button"
              className="qr-generator-tool__action-btn"
              onClick={onDownload}
              disabled={!hasOutput}
            >
              {labels.downloadButton}
            </button>
            <button
              type="button"
              className={clsx(
                "qr-generator-tool__action-btn",
                copied && "qr-generator-tool__action-btn--copied",
              )}
              onClick={() => void onCopyImage()}
              disabled={!hasOutput}
            >
              {copied ? labels.copied : labels.copyImageButton}
            </button>
          </div>
        </div>

        {renderError ? (
          <p className="qr-generator-tool__error" role="status">
            {renderError}
          </p>
        ) : null}
        {copyError ? (
          <p className="qr-generator-tool__error" role="status">
            {copyError}
          </p>
        ) : null}

        <div className="qr-generator-tool__preview">
          {hasOutput ? null : (
            <p className="qr-generator-tool__empty" aria-live="polite">
              {labels.outputEmpty}
            </p>
          )}
          <canvas
            ref={canvasRef}
            className={clsx("qr-generator-tool__canvas", !hasOutput && "qr-generator-tool__canvas--hidden")}
            aria-hidden={!hasOutput}
          />
        </div>
      </section>
    </div>
  );
}
