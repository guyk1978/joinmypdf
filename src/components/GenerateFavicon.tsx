"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
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
  backgroundColorLabel: string;
  textColorLabel: string;
  previewLabel: string;
  previewSize: (size: number) => string;
  formatLabel: string;
  formatPng: string;
  formatIco: string;
  download: string;
  downloading: string;
  emptyTextError: string;
};

type GenerateFaviconProps = {
  labels: GenerateFaviconLabels;
};

type ExportFormat = "png" | "ico";

const PREVIEW_SIZES = [16, 32, 64] as const;
const HERO_PREVIEW_SIZE = 128;

export function GenerateFavicon({ labels }: GenerateFaviconProps) {
  const [design, setDesign] = useState<FaviconDesign>(DEFAULT_FAVICON_DESIGN);
  const [format, setFormat] = useState<ExportFormat>("ico");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  const onDownload = async () => {
    const text = normalizeFaviconText(design.text);
    if (!text) {
      setError(labels.emptyTextError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const slug = text.toLowerCase().replace(/[^a-z0-9]/gi, "") || "favicon";
      if (format === "png") {
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
            onClick={() => void onDownload()}
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
        </div>
      </div>
    </div>
  );
}
