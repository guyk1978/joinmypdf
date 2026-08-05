"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  Check,
  Copy,
  Download,
  ImagePlus,
  Lock,
  LockOpen,
  RefreshCw,
  Shield,
} from "lucide-react";
import {
  copyTextToClipboard,
  formatsFromRgb,
  hexToRgb,
  parseColorInput,
  type RgbColor,
} from "@/lib/color-converter";
import {
  createDefaultPalette,
  downloadTextFile,
  evaluateContrast,
  HARMONY_MODES,
  paletteToCssVariables,
  paletteToJson,
  regeneratePalette,
  toggleSwatchLock,
  updateSwatchColor,
  type ContrastResult,
  type HarmonyMode,
  type PaletteSwatch,
} from "@/lib/color-palette-studio";
import {
  DEFAULT_COLOR_COUNT,
  extractPaletteFromFile,
  isAcceptedPaletteImage,
  type PaletteColor,
} from "@/lib/color-palette-extractor";

export type ColorPaletteStudioLabels = {
  generatorTitle: string;
  generatorDesc: string;
  extractorTitle: string;
  extractorDesc: string;
  converterTitle: string;
  converterDesc: string;
  harmonyLabel: string;
  regenerate: string;
  lock: string;
  unlock: string;
  copyHex: string;
  copyRgb: string;
  copyHsl: string;
  copied: string;
  copyFailed: string;
  downloadCss: string;
  downloadJson: string;
  dropHint: string;
  browse: string;
  extracting: string;
  extractError: string;
  invalidImage: string;
  clearImage: string;
  privacyLabel: string;
  fgLabel: string;
  bgLabel: string;
  previewLabel: string;
  ratioLabel: string;
  pass: string;
  fail: string;
  aaNormal: string;
  aaLarge: string;
  aaaNormal: string;
  aaaLarge: string;
  sampleText: string;
  hexLabel: string;
  rgbLabel: string;
  hslLabel: string;
  harmonies: Record<HarmonyMode, string>;
};

type ColorPaletteStudioProps = {
  labels: ColorPaletteStudioLabels;
  className?: string;
};

type CopyKey = string;

function contrastingInk(rgb: RgbColor): string {
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 140 ? "#111111" : "#ffffff";
}

export function ColorPaletteStudio({ labels, className }: ColorPaletteStudioProps) {
  const baseId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [harmony, setHarmony] = useState<HarmonyMode>("analogous");
  const [palette, setPalette] = useState<PaletteSwatch[]>(() => createDefaultPalette("analogous"));
  const [copied, setCopied] = useState<CopyKey | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<PaletteColor[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [fgHex, setFgHex] = useState("#F5F5F5");
  const [bgHex, setBgHex] = useState("#171717");
  const [inspectHex, setInspectHex] = useState("#2563EB");

  const contrast: ContrastResult = useMemo(() => {
    const fg = hexToRgb(fgHex) ?? { r: 245, g: 245, b: 245 };
    const bg = hexToRgb(bgHex) ?? { r: 23, g: 23, b: 23 };
    return evaluateContrast(fg, bg);
  }, [fgHex, bgHex]);

  const inspectRgb = hexToRgb(inspectHex) ?? { r: 37, g: 99, b: 235 };
  const inspectFormats = formatsFromRgb(inspectRgb);

  const markCopied = useCallback((key: CopyKey) => {
    setCopied(key);
    window.setTimeout(() => {
      setCopied((current) => (current === key ? null : current));
    }, 1400);
  }, []);

  const onCopy = useCallback(
    async (key: CopyKey, value: string) => {
      const ok = await copyTextToClipboard(value);
      if (ok) markCopied(key);
    },
    [markCopied],
  );

  const onRegenerate = () => {
    setPalette((current) => regeneratePalette(current, harmony));
  };

  const onHarmonyChange = (mode: HarmonyMode) => {
    setHarmony(mode);
    setPalette((current) => regeneratePalette(current, mode));
  };

  const runExtraction = async (file: File) => {
    if (!isAcceptedPaletteImage(file)) {
      setExtractError(labels.invalidImage);
      return;
    }
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await extractPaletteFromFile(file, DEFAULT_COLOR_COUNT);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(result.objectUrl);
      setImageName(file.name);
      setExtracted(result.colors);
    } catch {
      setExtractError(labels.extractError);
      setExtracted([]);
    } finally {
      setExtracting(false);
    }
  };

  const clearImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageName(null);
    setExtracted([]);
    setExtractError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDropFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void runExtraction(file);
  };

  return (
    <div className={clsx("color-palette-studio", className)}>
      {/* —— Generator —— */}
      <section className="cps-section" aria-labelledby={`${baseId}-gen`}>
        <header className="cps-section__head">
          <div>
            <h2 id={`${baseId}-gen`} className="cps-section__title">
              {labels.generatorTitle}
            </h2>
            <p className="cps-section__desc">{labels.generatorDesc}</p>
          </div>
          <div className="cps-section__actions">
            <label className="cps-field cps-field--inline">
              <span className="cps-field__label">{labels.harmonyLabel}</span>
              <select
                className="cps-select"
                value={harmony}
                onChange={(event) => onHarmonyChange(event.target.value as HarmonyMode)}
              >
                {HARMONY_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {labels.harmonies[mode]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="cps-btn cps-btn--primary" onClick={onRegenerate}>
              <RefreshCw size={15} strokeWidth={2} aria-hidden />
              {labels.regenerate}
            </button>
          </div>
        </header>

        <ul className="cps-swatch-grid" aria-label={labels.generatorTitle}>
          {palette.map((swatch, index) => {
            const formats = formatsFromRgb(swatch.rgb);
            const ink = contrastingInk(swatch.rgb);
            return (
              <li key={`${swatch.hex}-${index}`} className="cps-swatch">
                <div className="cps-swatch__chip" style={{ background: swatch.hex, color: ink }}>
                  <label className="cps-swatch__picker">
                    <span className="sr-only">{formats.hex}</span>
                    <input
                      type="color"
                      value={swatch.hex.toLowerCase()}
                      onChange={(event) => {
                        const rgb = hexToRgb(event.target.value);
                        if (!rgb) return;
                        setPalette((current) => updateSwatchColor(current, index, rgb));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="cps-swatch__lock"
                    aria-pressed={swatch.locked}
                    aria-label={swatch.locked ? labels.unlock : labels.lock}
                    onClick={() => setPalette((current) => toggleSwatchLock(current, index))}
                  >
                    {swatch.locked ? (
                      <Lock size={14} strokeWidth={2} aria-hidden />
                    ) : (
                      <LockOpen size={14} strokeWidth={2} aria-hidden />
                    )}
                  </button>
                </div>
                <div className="cps-swatch__meta">
                  <CopyRow
                    label={labels.hexLabel}
                    value={formats.hex}
                    copied={copied === `gen-hex-${index}`}
                    copiedLabel={labels.copied}
                    copyLabel={labels.copyHex}
                    onCopy={() => void onCopy(`gen-hex-${index}`, formats.hex)}
                  />
                  <CopyRow
                    label={labels.rgbLabel}
                    value={formats.rgb}
                    copied={copied === `gen-rgb-${index}`}
                    copiedLabel={labels.copied}
                    copyLabel={labels.copyRgb}
                    onCopy={() => void onCopy(`gen-rgb-${index}`, formats.rgb)}
                  />
                  <CopyRow
                    label={labels.hslLabel}
                    value={formats.hsl}
                    copied={copied === `gen-hsl-${index}`}
                    copiedLabel={labels.copied}
                    copyLabel={labels.copyHsl}
                    onCopy={() => void onCopy(`gen-hsl-${index}`, formats.hsl)}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="cps-toolbar">
          <button
            type="button"
            className="cps-btn"
            onClick={() =>
              downloadTextFile(
                "palette.css",
                `:root {\n${paletteToCssVariables(palette)}\n}\n`,
                "text/css",
              )
            }
          >
            <Download size={15} strokeWidth={2} aria-hidden />
            {labels.downloadCss}
          </button>
          <button
            type="button"
            className="cps-btn"
            onClick={() =>
              downloadTextFile("palette.json", paletteToJson(palette), "application/json")
            }
          >
            <Download size={15} strokeWidth={2} aria-hidden />
            {labels.downloadJson}
          </button>
        </div>
      </section>

      {/* —— Image extractor —— */}
      <section className="cps-section" aria-labelledby={`${baseId}-extract`}>
        <header className="cps-section__head">
          <div>
            <h2 id={`${baseId}-extract`} className="cps-section__title">
              {labels.extractorTitle}
            </h2>
            <p className="cps-section__desc">{labels.extractorDesc}</p>
          </div>
          <p className="cps-privacy" role="status">
            <Shield size={14} strokeWidth={2} aria-hidden />
            {labels.privacyLabel}
          </p>
        </header>

        <div
          className={clsx("cps-dropzone", dragging && "is-dragging")}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            onDropFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => onDropFiles(event.target.files)}
          />
          {imageUrl ? (
            <div className="cps-dropzone__preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="cps-dropzone__img" />
              <div className="cps-dropzone__preview-meta">
                {imageName ? <p className="cps-muted">{imageName}</p> : null}
                <button type="button" className="cps-btn" onClick={clearImage}>
                  {labels.clearImage}
                </button>
              </div>
            </div>
          ) : (
            <div className="cps-dropzone__empty">
              <ImagePlus size={28} strokeWidth={1.75} aria-hidden />
              <p>{labels.dropHint}</p>
              <button
                type="button"
                className="cps-btn cps-btn--primary"
                onClick={() => fileInputRef.current?.click()}
              >
                {labels.browse}
              </button>
            </div>
          )}
        </div>

        {extracting ? <p className="cps-status">{labels.extracting}</p> : null}
        {extractError ? <p className="cps-error">{extractError}</p> : null}

        {extracted.length > 0 ? (
          <ul className="cps-extract-grid">
            {extracted.map((color, index) => (
              <li key={`${color.hex}-${index}`} className="cps-extract-swatch">
                <span
                  className="cps-extract-swatch__chip"
                  style={{ background: color.hex }}
                  aria-hidden
                />
                <div className="cps-extract-swatch__meta">
                  <CopyRow
                    label={labels.hexLabel}
                    value={color.hex}
                    copied={copied === `ex-hex-${index}`}
                    copiedLabel={labels.copied}
                    copyLabel={labels.copyHex}
                    onCopy={() => void onCopy(`ex-hex-${index}`, color.hex)}
                  />
                  <CopyRow
                    label={labels.rgbLabel}
                    value={color.rgbLabel}
                    copied={copied === `ex-rgb-${index}`}
                    copiedLabel={labels.copied}
                    copyLabel={labels.copyRgb}
                    onCopy={() => void onCopy(`ex-rgb-${index}`, color.rgbLabel)}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {extracted.length > 0 ? (
          <div className="cps-toolbar">
            <button
              type="button"
              className="cps-btn"
              onClick={() =>
                downloadTextFile(
                  "extracted-palette.json",
                  JSON.stringify(
                    extracted.map((color) => ({ hex: color.hex, rgb: color.rgbLabel })),
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <Download size={15} strokeWidth={2} aria-hidden />
              {labels.downloadJson}
            </button>
          </div>
        ) : null}
      </section>

      {/* —— Inspector + contrast —— */}
      <section className="cps-section" aria-labelledby={`${baseId}-inspect`}>
        <header className="cps-section__head">
          <div>
            <h2 id={`${baseId}-inspect`} className="cps-section__title">
              {labels.converterTitle}
            </h2>
            <p className="cps-section__desc">{labels.converterDesc}</p>
          </div>
        </header>

        <div className="cps-inspect-grid">
          <div className="cps-card">
            <label className="cps-field">
              <span className="cps-field__label">{labels.hexLabel}</span>
              <div className="cps-field__row">
                <input
                  type="color"
                  className="cps-color-input"
                  value={inspectHex.toLowerCase()}
                  onChange={(event) => setInspectHex(event.target.value.toUpperCase())}
                  aria-label={labels.hexLabel}
                />
                <input
                  className="cps-input"
                  value={inspectHex}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setInspectHex(raw);
                    const parsed = parseColorInput("hex", raw);
                    if (parsed.ok) setInspectHex(formatsFromRgb(parsed.rgb).hex);
                  }}
                />
              </div>
            </label>
            <CopyRow
              label={labels.rgbLabel}
              value={inspectFormats.rgb}
              copied={copied === "inspect-rgb"}
              copiedLabel={labels.copied}
              copyLabel={labels.copyRgb}
              onCopy={() => void onCopy("inspect-rgb", inspectFormats.rgb)}
            />
            <CopyRow
              label={labels.hslLabel}
              value={inspectFormats.hsl}
              copied={copied === "inspect-hsl"}
              copiedLabel={labels.copied}
              copyLabel={labels.copyHsl}
              onCopy={() => void onCopy("inspect-hsl", inspectFormats.hsl)}
            />
            <div
              className="cps-inspect-preview"
              style={{ background: inspectFormats.hex }}
              aria-label={labels.previewLabel}
            />
          </div>

          <div className="cps-card">
            <div className="cps-contrast-fields">
              <label className="cps-field">
                <span className="cps-field__label">{labels.fgLabel}</span>
                <div className="cps-field__row">
                  <input
                    type="color"
                    className="cps-color-input"
                    value={fgHex.toLowerCase()}
                    onChange={(event) => setFgHex(event.target.value.toUpperCase())}
                  />
                  <input
                    className="cps-input"
                    value={fgHex}
                    onChange={(event) => setFgHex(event.target.value.toUpperCase())}
                  />
                </div>
              </label>
              <label className="cps-field">
                <span className="cps-field__label">{labels.bgLabel}</span>
                <div className="cps-field__row">
                  <input
                    type="color"
                    className="cps-color-input"
                    value={bgHex.toLowerCase()}
                    onChange={(event) => setBgHex(event.target.value.toUpperCase())}
                  />
                  <input
                    className="cps-input"
                    value={bgHex}
                    onChange={(event) => setBgHex(event.target.value.toUpperCase())}
                  />
                </div>
              </label>
            </div>

            <div
              className="cps-contrast-preview"
              style={{ background: bgHex, color: fgHex }}
            >
              <p className="cps-contrast-preview__sample">{labels.sampleText}</p>
              <p className="cps-contrast-preview__ratio">
                {labels.ratioLabel}: <strong>{contrast.ratio.toFixed(2)}:1</strong>
              </p>
            </div>

            <ul className="cps-contrast-checks">
              <ContrastCheck
                label={labels.aaNormal}
                ok={contrast.passesAaNormal}
                passLabel={labels.pass}
                failLabel={labels.fail}
              />
              <ContrastCheck
                label={labels.aaLarge}
                ok={contrast.passesAaLarge}
                passLabel={labels.pass}
                failLabel={labels.fail}
              />
              <ContrastCheck
                label={labels.aaaNormal}
                ok={contrast.passesAaaNormal}
                passLabel={labels.pass}
                failLabel={labels.fail}
              />
              <ContrastCheck
                label={labels.aaaLarge}
                ok={contrast.passesAaaLarge}
                passLabel={labels.pass}
                failLabel={labels.fail}
              />
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  copiedLabel,
  copyLabel,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  copiedLabel: string;
  copyLabel: string;
  onCopy: () => void;
}) {
  return (
    <div className="cps-copy-row">
      <span className="cps-copy-row__label">{label}</span>
      <code className="cps-copy-row__value">{value}</code>
      <button
        type="button"
        className={clsx("cps-icon-btn", copied && "is-done")}
        onClick={onCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
      >
        {copied ? <Check size={14} strokeWidth={2} aria-hidden /> : <Copy size={14} strokeWidth={2} aria-hidden />}
      </button>
    </div>
  );
}

function ContrastCheck({
  label,
  ok,
  passLabel,
  failLabel,
}: {
  label: string;
  ok: boolean;
  passLabel: string;
  failLabel: string;
}) {
  return (
    <li className={clsx("cps-contrast-check", ok ? "is-pass" : "is-fail")}>
      <span>{label}</span>
      <strong>{ok ? passLabel : failLabel}</strong>
    </li>
  );
}
