"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { imBtnCta } from "@/lib/design-system";
import {
  autoScaleLogoPercent,
  downloadBlob,
  isAcceptedImageFile,
  loadBaseImage,
  loadLogoImage,
  renderWatermarkedCanvas,
  WATERMARK_FONTS,
  WATERMARK_POSITIONS,
  watermarkOutputName,
  yieldFrame,
  zipWatermarkOutputs,
  type WatermarkFont,
  type WatermarkOptions,
  type WatermarkPosition,
  type WatermarkType,
} from "@/lib/image-watermark";

export type ImageWatermarkLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  sidebarTitle: string;
  typeTitle: string;
  typeText: string;
  typeLogo: string;
  textLabel: string;
  textPlaceholder: string;
  fontLabel: string;
  colorLabel: string;
  opacityLabel: string;
  sizeLabel: string;
  logoLabel: string;
  logoHint: string;
  logoSelect: string;
  autoScaleLogo: string;
  logoScaleLabel: string;
  positionTitle: string;
  offsetXLabel: string;
  offsetYLabel: string;
  previewTitle: string;
  batchHint: string;
  activeImageLabel: string;
  applyDownload: string;
  applying: string;
  replaceImages: string;
  removeLogo: string;
  privacyLabel: string;
  invalidFile: string;
  invalidLogo: string;
  errorEmptyText: string;
  errorNoLogo: string;
  errorGeneric: string;
  positionLabels: Record<WatermarkPosition, string>;
  pageTitle: string;
};

type ImageWatermarkProps = {
  labels: ImageWatermarkLabels;
  className?: string;
};

type LoadedItem = {
  id: string;
  file: File;
  image: HTMLImageElement;
  objectUrl: string;
  width: number;
  height: number;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";
const LOGO_ACCEPT = "image/png,image/webp,image/jpeg,.png,.webp,.jpg,.jpeg";

function createItemId(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ImageWatermark({ labels, className }: ImageWatermarkProps) {
  const textId = useId();
  const fontId = useId();
  const colorId = useId();
  const opacityId = useId();
  const sizeId = useId();
  const logoScaleId = useId();
  const offsetXId = useId();
  const offsetYId = useId();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [items, setItems] = useState<LoadedItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [type, setType] = useState<WatermarkType>("text");
  const [text, setText] = useState("© JoinMyPDF");
  const [fontFamily, setFontFamily] = useState<WatermarkFont>("Arial, Helvetica, sans-serif");
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.55);
  const [sizePercent, setSizePercent] = useState(8);
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [logoScalePercent, setLogoScalePercent] = useState(autoScaleLogoPercent());
  const [logo, setLogo] = useState<{ image: HTMLImageElement; objectUrl: string; name: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0] ?? null,
    [items, activeId],
  );

  const revokeAll = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.objectUrl);
      return [];
    });
    setLogo((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  useEffect(() => () => revokeAll(), [revokeAll]);

  const buildOptions = useCallback((): WatermarkOptions | null => {
    if (type === "text") {
      return {
        type: "text",
        text,
        fontFamily,
        color,
        opacity,
        sizePercent,
        position,
        offsetX,
        offsetY,
      };
    }
    if (!logo) return null;
    return {
      type: "logo",
      logo: logo.image,
      scalePercent: logoScalePercent,
      opacity,
      position,
      offsetX,
      offsetY,
    };
  }, [
    type,
    text,
    fontFamily,
    color,
    opacity,
    sizePercent,
    position,
    offsetX,
    offsetY,
    logo,
    logoScalePercent,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeItem) return;
    const options = buildOptions();
    if (!options) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = activeItem.width;
      canvas.height = activeItem.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(activeItem.image, 0, 0);
      return;
    }
    renderWatermarkedCanvas(canvas, activeItem.image, options);
  }, [activeItem, buildOptions]);

  const reset = () => {
    for (const item of items) URL.revokeObjectURL(item.objectUrl);
    if (logo) URL.revokeObjectURL(logo.objectUrl);
    setItems([]);
    setActiveId(null);
    setLogo(null);
    setError(null);
    setCompleted(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const loadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList || []).filter(isAcceptedImageFile);
    if (!files.length) {
      setError(labels.invalidFile);
      return;
    }

    setError(null);
    setCompleted(false);

    const next: LoadedItem[] = [];
    for (const file of files) {
      try {
        const loaded = await loadBaseImage(file);
        next.push({
          id: createItemId(),
          file: loaded.file,
          image: loaded.image,
          objectUrl: loaded.objectUrl,
          width: loaded.width,
          height: loaded.height,
        });
      } catch {
        /* skip bad file */
      }
    }

    if (!next.length) {
      setError(labels.invalidFile);
      return;
    }

    setItems((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.objectUrl);
      return next;
    });
    setActiveId(next[0]!.id);
  };

  const handleLogoFile = async (file: File | null) => {
    if (!file) return;
    if (!isAcceptedImageFile(file)) {
      setError(labels.invalidLogo);
      return;
    }
    try {
      const loaded = await loadLogoImage(file);
      setLogo((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return { image: loaded.image, objectUrl: loaded.objectUrl, name: file.name };
      });
      setLogoScalePercent(autoScaleLogoPercent());
      setError(null);
    } catch {
      setError(labels.invalidLogo);
    }
  };

  const handleApplyDownload = async () => {
    if (!items.length || busy) return;

    if (type === "text" && !text.trim()) {
      setError(labels.errorEmptyText);
      return;
    }
    if (type === "logo" && !logo) {
      setError(labels.errorNoLogo);
      return;
    }

    const options = buildOptions();
    if (!options) {
      setError(labels.errorGeneric);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const outputs: Array<{ fileName: string; blob: Blob }> = [];

      for (const item of items) {
        const canvas = document.createElement("canvas");
        renderWatermarkedCanvas(canvas, item.image, options);
        const blob = await new Promise<Blob>((resolve, reject) => {
          const mime =
            item.file.type === "image/jpeg" || /\.jpe?g$/i.test(item.file.name)
              ? "image/jpeg"
              : item.file.type === "image/webp" || /\.webp$/i.test(item.file.name)
                ? "image/webp"
                : "image/png";
          canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("export"))),
            mime,
            mime === "image/png" ? undefined : 0.92,
          );
        });
        outputs.push({
          fileName: watermarkOutputName(item.file.name, blob.type),
          blob,
        });
        await yieldFrame();
      }

      if (outputs.length === 1) {
        downloadBlob(outputs[0]!.blob, outputs[0]!.fileName);
      } else {
        const zip = await zipWatermarkOutputs(outputs);
        downloadBlob(zip, `joinmypdf-watermarked-${outputs.length}-files.zip`);
      }
      setCompleted(true);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={clsx("image-watermark", className)}>
      {items.length === 0 ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG", "WEBP", "GIF", "HEIC"]}
          accept={ACCEPT}
          multiple
          onFiles={(files) => void loadFiles(files)}
        />
      ) : (
        <div className="image-watermark__layout">
          <aside className="image-watermark__sidebar tool-workspace-panel security-tool__pane">
            <h2 className="security-tool__section-title">{labels.sidebarTitle}</h2>

            <section className="image-watermark__section">
              <h3 className="image-watermark__section-title">{labels.typeTitle}</h3>
              <div className="image-watermark__toggle">
                <button
                  type="button"
                  className={clsx(
                    "image-watermark__toggle-btn",
                    type === "text" && "image-watermark__toggle-btn--active",
                  )}
                  onClick={() => setType("text")}
                >
                  {labels.typeText}
                </button>
                <button
                  type="button"
                  className={clsx(
                    "image-watermark__toggle-btn",
                    type === "logo" && "image-watermark__toggle-btn--active",
                  )}
                  onClick={() => setType("logo")}
                >
                  {labels.typeLogo}
                </button>
              </div>
            </section>

            {type === "text" ? (
              <section className="image-watermark__section">
                <label className="image-watermark__field" htmlFor={textId}>
                  <span>{labels.textLabel}</span>
                  <input
                    id={textId}
                    className="image-watermark__input"
                    value={text}
                    placeholder={labels.textPlaceholder}
                    onChange={(event) => setText(event.target.value)}
                  />
                </label>
                <label className="image-watermark__field" htmlFor={fontId}>
                  <span>{labels.fontLabel}</span>
                  <select
                    id={fontId}
                    className="image-watermark__input"
                    value={fontFamily}
                    onChange={(event) => setFontFamily(event.target.value as WatermarkFont)}
                  >
                    {WATERMARK_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="image-watermark__field" htmlFor={colorId}>
                  <span>{labels.colorLabel}</span>
                  <input
                    id={colorId}
                    type="color"
                    className="image-watermark__color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                  />
                </label>
                <label className="image-watermark__field" htmlFor={sizeId}>
                  <span>
                    {labels.sizeLabel}: {sizePercent}%
                  </span>
                  <input
                    id={sizeId}
                    type="range"
                    min={2}
                    max={40}
                    value={sizePercent}
                    onChange={(event) => setSizePercent(Number(event.target.value))}
                  />
                </label>
              </section>
            ) : (
              <section className="image-watermark__section">
                <p className="image-watermark__hint">{labels.logoHint}</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  className="sr-only"
                  onChange={(event) => void handleLogoFile(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="image-watermark__tool-btn"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {labels.logoSelect}
                </button>
                {logo ? (
                  <>
                    <p className="image-watermark__hint">{logo.name}</p>
                    <button
                      type="button"
                      className="image-watermark__tool-btn image-watermark__tool-btn--accent"
                      onClick={() => setLogoScalePercent(autoScaleLogoPercent())}
                    >
                      {labels.autoScaleLogo}
                    </button>
                    <label className="image-watermark__field" htmlFor={logoScaleId}>
                      <span>
                        {labels.logoScaleLabel}: {logoScalePercent}%
                      </span>
                      <input
                        id={logoScaleId}
                        type="range"
                        min={2}
                        max={60}
                        value={logoScalePercent}
                        onChange={(event) => setLogoScalePercent(Number(event.target.value))}
                      />
                    </label>
                    <button
                      type="button"
                      className="image-watermark__link-btn"
                      onClick={() => {
                        setLogo((prev) => {
                          if (prev) URL.revokeObjectURL(prev.objectUrl);
                          return null;
                        });
                        if (logoInputRef.current) logoInputRef.current.value = "";
                      }}
                    >
                      {labels.removeLogo}
                    </button>
                  </>
                ) : null}
              </section>
            )}

            <section className="image-watermark__section">
              <label className="image-watermark__field" htmlFor={opacityId}>
                <span>
                  {labels.opacityLabel}: {Math.round(opacity * 100)}%
                </span>
                <input
                  id={opacityId}
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                />
              </label>
            </section>

            <section className="image-watermark__section">
              <h3 className="image-watermark__section-title">{labels.positionTitle}</h3>
              <div className="image-watermark__grid" role="group" aria-label={labels.positionTitle}>
                {WATERMARK_POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    className={clsx(
                      "image-watermark__grid-btn",
                      position === pos && "image-watermark__grid-btn--active",
                    )}
                    aria-label={labels.positionLabels[pos]}
                    aria-pressed={position === pos}
                    onClick={() => setPosition(pos)}
                  />
                ))}
              </div>
              <div className="image-watermark__offset-row">
                <label className="image-watermark__field" htmlFor={offsetXId}>
                  <span>{labels.offsetXLabel}</span>
                  <input
                    id={offsetXId}
                    type="number"
                    className="image-watermark__input"
                    value={offsetX}
                    onChange={(event) => setOffsetX(Number(event.target.value) || 0)}
                  />
                </label>
                <label className="image-watermark__field" htmlFor={offsetYId}>
                  <span>{labels.offsetYLabel}</span>
                  <input
                    id={offsetYId}
                    type="number"
                    className="image-watermark__input"
                    value={offsetY}
                    onChange={(event) => setOffsetY(Number(event.target.value) || 0)}
                  />
                </label>
              </div>
            </section>

            <button
              type="button"
              className="image-watermark__tool-btn"
              onClick={reset}
              disabled={busy}
            >
              {labels.replaceImages}
            </button>
          </aside>

          <div className="image-watermark__main tool-workspace-panel security-tool__pane">
            <div className="image-watermark__preview-head">
              <h2 className="security-tool__section-title">{labels.previewTitle}</h2>
              {items.length > 1 ? (
                <p className="image-watermark__hint">{labels.batchHint.replace("{count}", String(items.length))}</p>
              ) : null}
            </div>

            {items.length > 1 ? (
              <div className="image-watermark__thumbs" aria-label={labels.activeImageLabel}>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={clsx(
                      "image-watermark__thumb",
                      activeItem?.id === item.id && "image-watermark__thumb--active",
                    )}
                    onClick={() => setActiveId(item.id)}
                  >
                    <img src={item.objectUrl} alt="" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="image-watermark__stage">
              <canvas ref={canvasRef} className="image-watermark__canvas" />
            </div>

            <div className="image-watermark__actions">
              <button
                type="button"
                className={clsx(imBtnCta, "image-watermark__primary-btn")}
                onClick={() => void handleApplyDownload()}
                disabled={busy}
              >
                {busy ? labels.applying : labels.applyDownload}
              </button>
            </div>

            <p className="image-watermark__privacy">{labels.privacyLabel}</p>

            {completed ? (
              <ToolSuccessEngagement
                pageTitle={labels.pageTitle}
                className="image-watermark__engagement"
              />
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <p className="image-watermark__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
