"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Palette } from "lucide-react";
import { buildBrandHarmonyPalettes } from "@/lib/favicon-brand-harmony";
import {
  GenerateFaviconMobilePreview,
  type GenerateFaviconMobilePreviewLabels,
} from "@/components/GenerateFaviconMobilePreview";
import {
  GenerateFaviconContrastChecker,
  type GenerateFaviconContrastCheckerLabels,
} from "@/components/GenerateFaviconContrastChecker";
import {
  GenerateFaviconHeaderCode,
  type GenerateFaviconHeaderCodeLabels,
} from "@/components/GenerateFaviconHeaderCode";
import {
  DEFAULT_FAVICON_DESIGN,
  drawFaviconOnCanvas,
  downloadBlob,
  exportFaviconIco,
  exportFaviconPng,
  normalizeFaviconText,
  type FaviconDesign,
} from "@/lib/generate-favicon";
import { toolPrimaryBtn } from "@/lib/tool-ui";

export type GenerateFaviconLabels = {
  instructions: string;
  textLabel: string;
  textPlaceholder: string;
  textHint: string;
  brandColorLabel: string;
  brandColorHint: string;
  harmonyButton: string;
  harmonyButtonAria: (index: number, total: number) => string;
  backgroundColorLabel: string;
  textColorLabel: string;
  previewLabel: string;
  previewSize: (size: number) => string;
  formatLabel: string;
  formatPng: string;
  formatIco: string;
  download: string;
  downloadIco: string;
  downloadPng: string;
  exportIcoHint: string;
  downloading: string;
  emptyTextError: string;
} & GenerateFaviconMobilePreviewLabels &
  GenerateFaviconContrastCheckerLabels &
  GenerateFaviconHeaderCodeLabels;

type GenerateFaviconProps = {
  labels: GenerateFaviconLabels;
};

type ExportFormat = "png" | "ico";

const PREVIEW_SIZES = [16, 32, 64] as const;
const HERO_PREVIEW_SIZE = 128;

export function GenerateFavicon({ labels }: GenerateFaviconProps) {
  const [design, setDesign] = useState<FaviconDesign>(DEFAULT_FAVICON_DESIGN);
  const [brandColor, setBrandColor] = useState(DEFAULT_FAVICON_DESIGN.backgroundColor);
  const [harmonyIndex, setHarmonyIndex] = useState(0);
  const [format, setFormat] = useState<ExportFormat>("ico");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const harmonyPalettes = useMemo(() => buildBrandHarmonyPalettes(brandColor), [brandColor]);

  const heroCanvasRef = useRef<HTMLCanvasElement>(null);

  const attachSizeCanvas = useCallback(
    (size: number) => (node: HTMLCanvasElement | null) => {
      if (!node) return;
      const ctx = node.getContext("2d");
      if (ctx) drawFaviconOnCanvas(ctx, size, design);
    },
    [design],
  );

  useEffect(() => {
    const hero = heroCanvasRef.current;
    if (!hero) return;
    const ctx = hero.getContext("2d");
    if (ctx) drawFaviconOnCanvas(ctx, HERO_PREVIEW_SIZE, design);
  }, [design]);

  const onTextChange = (value: string) => {
    setError("");
    setDesign((prev) => ({ ...prev, text: value.slice(0, 2) }));
  };

  const onBrandColorChange = (value: string) => {
    setBrandColor(value);
    setHarmonyIndex(0);
  };

  const onHarmonyCycle = () => {
    if (!harmonyPalettes.length) return;
    const nextIndex = (harmonyIndex + 1) % harmonyPalettes.length;
    const palette = harmonyPalettes[nextIndex];
    if (!palette) return;
    setHarmonyIndex(nextIndex);
    setDesign((prev) => ({
      ...prev,
      backgroundColor: palette.backgroundColor,
      textColor: palette.textColor,
    }));
  };

  const downloadDesign = async (exportFormat: ExportFormat) => {
    const text = normalizeFaviconText(design.text);
    if (!text) {
      setError(labels.emptyTextError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const slug = text.toLowerCase().replace(/[^a-z0-9]/gi, "") || "favicon";
      if (exportFormat === "png") {
        const blob = await exportFaviconPng(design, 32);
        downloadBlob(blob, `${slug}-favicon.png`);
      } else {
        const blob = await exportFaviconIco(design);
        downloadBlob(blob, `${slug}-favicon.ico`);
      }
    } catch {
      setError(labels.emptyTextError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="generate-favicon-tool">
      <div className="generate-favicon-tool__layout">
        <div className="generate-favicon-tool__controls tool-workspace-panel">
          <p className="generate-favicon-tool__instructions">{labels.instructions}</p>

          <div className="generate-favicon-tool__field">
            <label className="generate-favicon-tool__label" htmlFor="favicon-text">
              {labels.textLabel}
            </label>
            <input
              id="favicon-text"
              type="text"
              className="generate-favicon-tool__input"
              value={design.text}
              maxLength={2}
              placeholder={labels.textPlaceholder}
              onChange={(event) => onTextChange(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="generate-favicon-tool__hint">{labels.textHint}</p>
          </div>

          <div className="generate-favicon-tool__field">
            <label className="generate-favicon-tool__label" htmlFor="favicon-brand-color">
              {labels.brandColorLabel}
            </label>
            <div className="generate-favicon-tool__brand-row">
              <div className="generate-favicon-tool__color-row">
                <input
                  id="favicon-brand-color"
                  type="color"
                  className="generate-favicon-tool__color-input"
                  value={brandColor}
                  onChange={(event) => onBrandColorChange(event.target.value)}
                />
                <input
                  type="text"
                  className="generate-favicon-tool__input generate-favicon-tool__hex-input"
                  value={brandColor}
                  onChange={(event) => onBrandColorChange(event.target.value)}
                  spellCheck={false}
                  aria-label={labels.brandColorLabel}
                />
              </div>
              <button
                type="button"
                className="generate-favicon-tool__harmony-btn"
                onClick={onHarmonyCycle}
                disabled={!harmonyPalettes.length}
                aria-label={labels.harmonyButtonAria(
                  harmonyPalettes.length ? harmonyIndex + 1 : 0,
                  harmonyPalettes.length,
                )}
                title={labels.brandColorHint}
              >
                <Palette className="h-4 w-4" aria-hidden />
                {labels.harmonyButton}
              </button>
            </div>
            <p className="generate-favicon-tool__hint">{labels.brandColorHint}</p>
          </div>

          <div className="generate-favicon-tool__color-grid">
            <div className="generate-favicon-tool__field">
              <label className="generate-favicon-tool__label" htmlFor="favicon-bg-color">
                {labels.backgroundColorLabel}
              </label>
              <div className="generate-favicon-tool__color-row">
                <input
                  id="favicon-bg-color"
                  type="color"
                  className="generate-favicon-tool__color-input"
                  value={design.backgroundColor}
                  onChange={(event) =>
                    setDesign((prev) => ({ ...prev, backgroundColor: event.target.value }))
                  }
                />
                <input
                  type="text"
                  className="generate-favicon-tool__input generate-favicon-tool__hex-input"
                  value={design.backgroundColor}
                  onChange={(event) =>
                    setDesign((prev) => ({ ...prev, backgroundColor: event.target.value }))
                  }
                  spellCheck={false}
                  aria-label={labels.backgroundColorLabel}
                />
              </div>
            </div>

            <div className="generate-favicon-tool__field">
              <label className="generate-favicon-tool__label" htmlFor="favicon-text-color">
                {labels.textColorLabel}
              </label>
              <div className="generate-favicon-tool__color-row">
                <input
                  id="favicon-text-color"
                  type="color"
                  className="generate-favicon-tool__color-input"
                  value={design.textColor}
                  onChange={(event) =>
                    setDesign((prev) => ({ ...prev, textColor: event.target.value }))
                  }
                />
                <input
                  type="text"
                  className="generate-favicon-tool__input generate-favicon-tool__hex-input"
                  value={design.textColor}
                  onChange={(event) =>
                    setDesign((prev) => ({ ...prev, textColor: event.target.value }))
                  }
                  spellCheck={false}
                  aria-label={labels.textColorLabel}
                />
              </div>
            </div>
          </div>

          <GenerateFaviconContrastChecker
            backgroundColor={design.backgroundColor}
            textColor={design.textColor}
            labels={labels}
          />

          <div className="generate-favicon-tool__field">
            <span className="generate-favicon-tool__label" id="favicon-format-label">
              {labels.formatLabel}
            </span>
            <div className="generate-favicon-tool__format-row" role="radiogroup" aria-labelledby="favicon-format-label">
              <label className="generate-favicon-tool__format-option">
                <input
                  type="radio"
                  name="favicon-format"
                  value="ico"
                  checked={format === "ico"}
                  onChange={() => setFormat("ico")}
                />
                <span>{labels.formatIco}</span>
              </label>
              <label className="generate-favicon-tool__format-option">
                <input
                  type="radio"
                  name="favicon-format"
                  value="png"
                  checked={format === "png"}
                  onChange={() => setFormat("png")}
                />
                <span>{labels.formatPng}</span>
              </label>
            </div>
          </div>

          {error ? (
            <p className="generate-favicon-tool__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className={`generate-favicon-tool__download ${toolPrimaryBtn}`}
            disabled={busy}
            onClick={() => void downloadDesign(format)}
          >
            <Download className="h-4 w-4" aria-hidden />
            {busy ? labels.downloading : labels.download}
          </button>
        </div>

        <div className="generate-favicon-tool__preview tool-workspace-panel">
          <p className="generate-favicon-tool__label">{labels.previewLabel}</p>
          <div className="generate-favicon-tool__preview-hero">
            <canvas
              ref={heroCanvasRef}
              width={HERO_PREVIEW_SIZE}
              height={HERO_PREVIEW_SIZE}
              className="generate-favicon-tool__preview-canvas generate-favicon-tool__preview-canvas--hero"
              aria-hidden
            />
          </div>
          <div className="generate-favicon-tool__preview-sizes">
            {PREVIEW_SIZES.map((size) => (
              <div key={size} className="generate-favicon-tool__preview-size">
                <canvas
                  ref={attachSizeCanvas(size)}
                  width={size}
                  height={size}
                  className="generate-favicon-tool__preview-canvas"
                  aria-hidden
                />
                <span className="generate-favicon-tool__preview-size-label">
                  {labels.previewSize(size)}
                </span>
              </div>
            ))}
          </div>

          <div className="generate-favicon-tool__export-panel">
            <p className="generate-favicon-tool__export-hint">{labels.exportIcoHint}</p>
            <div className="generate-favicon-tool__export-actions">
              <button
                type="button"
                className={`generate-favicon-tool__export-btn generate-favicon-tool__export-btn--primary ${toolPrimaryBtn}`}
                disabled={busy}
                onClick={() => void downloadDesign("ico")}
              >
                <Download className="h-4 w-4" aria-hidden />
                {busy ? labels.downloading : labels.downloadIco}
              </button>
              <button
                type="button"
                className="generate-favicon-tool__export-btn"
                disabled={busy}
                onClick={() => void downloadDesign("png")}
              >
                <Download className="h-4 w-4" aria-hidden />
                {labels.downloadPng}
              </button>
            </div>
          </div>
        </div>
      </div>

      <GenerateFaviconMobilePreview design={design} labels={labels} />

      <GenerateFaviconHeaderCode faviconText={design.text} format={format} labels={labels} />
    </div>
  );
}
