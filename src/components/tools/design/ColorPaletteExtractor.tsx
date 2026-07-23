"use client";

import { clsx } from "clsx";
import { Check, Copy, Loader2, Shield } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import {
  copyTextToClipboard,
  DEFAULT_COLOR_COUNT,
  extractPaletteFromFile,
  isAcceptedPaletteImage,
  MAX_COLOR_COUNT,
  MIN_COLOR_COUNT,
  type PaletteColor,
} from "@/lib/color-palette-extractor";

export type ColorPaletteExtractorLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  dashboardTitle: string;
  emptyDashboard: string;
  analyzing: string;
  colorCountLabel: string;
  referenceLabel: string;
  swatchHex: string;
  swatchRgb: string;
  copyHex: string;
  copied: string;
  copyFailed: string;
  replaceImage: string;
  privacyLabel: string;
  invalidFile: string;
  errorGeneric: string;
  dimensionsLabel: string;
  pageTitle: string;
};

type ColorPaletteExtractorProps = {
  labels: ColorPaletteExtractorLabels;
  className?: string;
  /** Notifies parent when upload → workspace phase changes. */
  onActiveChange?: (active: boolean) => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

export function ColorPaletteExtractor({
  labels,
  className,
  onActiveChange,
}: ColorPaletteExtractorProps) {
  const countId = useId();
  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [colors, setColors] = useState<PaletteColor[]>([]);
  const [colorCount, setColorCount] = useState(DEFAULT_COLOR_COUNT);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [paletteReady, setPaletteReady] = useState(false);

  const previewUrlRef = useRef<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const analysisSeq = useRef(0);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    onActiveChange?.(hasFile);
  }, [hasFile, onActiveChange]);

  const revokePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const runExtraction = async (file: File, count: number) => {
    const seq = ++analysisSeq.current;
    setAnalyzing(true);
    setError(null);
    setCopiedHex(null);

    try {
      const result = await extractPaletteFromFile(file, count);
      if (seq !== analysisSeq.current) {
        URL.revokeObjectURL(result.objectUrl);
        return;
      }

      revokePreview();
      previewUrlRef.current = result.objectUrl;
      setPreviewUrl(result.objectUrl);
      setFileName(file.name);
      setDimensions({ w: result.width, h: result.height });
      setColors(result.colors);
      setPaletteReady(true);
    } catch {
      if (seq !== analysisSeq.current) return;
      setError(labels.errorGeneric);
      setColors([]);
      setPaletteReady(false);
    } finally {
      if (seq === analysisSeq.current) setAnalyzing(false);
    }
  };

  const onFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const file = list.find(isAcceptedPaletteImage);
    if (!file) {
      setError(labels.invalidFile);
      return;
    }
    fileRef.current = file;
    setHasFile(true);
    setFileName(file.name);
    setError(null);
    setColors([]);
    setPaletteReady(false);

    // Immediate local preview while ColorThief runs
    revokePreview();
    const eagerUrl = URL.createObjectURL(file);
    previewUrlRef.current = eagerUrl;
    setPreviewUrl(eagerUrl);

    void runExtraction(file, colorCount);
  };

  const onColorCountChange = (next: number) => {
    setColorCount(next);
    if (fileRef.current) void runExtraction(fileRef.current, next);
  };

  const onCopy = async (hex: string) => {
    const ok = await copyTextToClipboard(hex);
    if (!ok) {
      setError(labels.copyFailed);
      return;
    }
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex((current) => (current === hex ? null : current));
    }, 1400);
  };

  const reset = () => {
    analysisSeq.current += 1;
    fileRef.current = null;
    revokePreview();
    setHasFile(false);
    setPreviewUrl(null);
    setFileName(null);
    setDimensions(null);
    setColors([]);
    setError(null);
    setCopiedHex(null);
    setPaletteReady(false);
    setAnalyzing(false);
  };

  const hasPalette = colors.length > 0 && !analyzing;

  if (!hasFile) {
    return (
      <div className={clsx("color-palette-extractor", className)}>
        {error ? <p className="color-palette-extractor__error">{error}</p> : null}
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG", "WebP", "GIF"]}
          privacyLabel={labels.privacyLabel}
          accept={ACCEPT}
          disabled={analyzing}
          onFiles={onFiles}
        />
      </div>
    );
  }

  return (
    <div className={clsx("color-palette-extractor color-palette-extractor--active", className)}>
      <div className="color-palette-extractor__layout">
        <aside className="color-palette-extractor__upload">
          <div className="color-palette-extractor__ref-panel">
            <p className="color-palette-extractor__section-title">{labels.referenceLabel}</p>
            {previewUrl ? (
              // Reference thumbnail — blob URL, not suitable for next/image
              <img
                src={previewUrl}
                alt={fileName ?? labels.referenceLabel}
                className="color-palette-extractor__ref-img"
              />
            ) : null}
            {dimensions ? (
              <p className="color-palette-extractor__meta">
                {labels.dimensionsLabel
                  .replace("{width}", String(dimensions.w))
                  .replace("{height}", String(dimensions.h))}
              </p>
            ) : null}
            {fileName ? <p className="color-palette-extractor__filename">{fileName}</p> : null}
            <p className="color-palette-extractor__privacy-badge" role="status">
              <Shield className="color-palette-extractor__privacy-icon" strokeWidth={2} aria-hidden />
              <span>{labels.privacyLabel}</span>
            </p>
            <button type="button" className="color-palette-extractor__link-btn" onClick={reset}>
              {labels.replaceImage}
            </button>
          </div>
        </aside>

        <section className="color-palette-extractor__dashboard" aria-live="polite">
          <div className="color-palette-extractor__dashboard-head">
            <h2 className="color-palette-extractor__section-title">{labels.dashboardTitle}</h2>
            <div className="color-palette-extractor__field">
              <label htmlFor={countId}>
                {labels.colorCountLabel.replace("{count}", String(colorCount))}
              </label>
              <input
                id={countId}
                type="range"
                min={MIN_COLOR_COUNT}
                max={MAX_COLOR_COUNT}
                step={1}
                value={colorCount}
                disabled={!fileRef.current || analyzing}
                onChange={(event) => onColorCountChange(Number(event.target.value))}
              />
            </div>
          </div>

          {error ? <p className="color-palette-extractor__error">{error}</p> : null}

          {analyzing ? (
            <div className="color-palette-extractor__loading" role="status">
              <Loader2 className="color-palette-extractor__spinner" aria-hidden />
              <span>{labels.analyzing}</span>
            </div>
          ) : null}

          {!analyzing && !hasPalette ? (
            <p className="color-palette-extractor__empty">{labels.emptyDashboard}</p>
          ) : null}

          {hasPalette ? (
            <ul className="color-palette-extractor__swatches">
              {colors.map((color) => {
                const isCopied = copiedHex === color.hex;
                return (
                  <li key={color.hex} className="color-palette-extractor__swatch">
                    <span
                      className="color-palette-extractor__chip"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden
                    />
                    <div className="color-palette-extractor__swatch-meta">
                      <button
                        type="button"
                        className="color-palette-extractor__hex"
                        onClick={() => void onCopy(color.hex)}
                        aria-label={`${labels.copyHex}: ${color.hex}`}
                      >
                        <span className="color-palette-extractor__hex-label">{labels.swatchHex}</span>
                        <code>{color.hex}</code>
                      </button>
                      <p className="color-palette-extractor__rgb">
                        <span>{labels.swatchRgb}</span> {color.rgbLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={clsx(
                        "color-palette-extractor__copy",
                        isCopied && "color-palette-extractor__copy--done",
                      )}
                      onClick={() => void onCopy(color.hex)}
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} aria-hidden />
                          {labels.copied}
                        </>
                      ) : (
                        <>
                          <Copy size={14} aria-hidden />
                          {labels.copyHex}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {paletteReady && hasPalette ? (
            <ToolSuccessEngagement
              pageTitle={labels.pageTitle}
              fileContext={fileName ?? undefined}
              className="color-palette-extractor__engagement"
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
