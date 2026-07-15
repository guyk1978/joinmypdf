"use client";

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { Magnifier } from "@/components/Magnifier";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { downloadBlob, isAcceptedImageFile } from "@/lib/crop-image";
import { imBtnCta } from "@/lib/design-system";
import {
  GRID_PRESETS,
  loadGridSplitterSource,
  MAX_GRID,
  MIN_GRID,
  normalizeGrid,
  presetToGrid,
  splitImageIntoGrid,
  type GridPresetId,
} from "@/lib/image-grid-splitter";

export type ImageGridSplitterLabels = {
  dropTitle: string;
  dropHint: string;
  selectFile: string;
  selectFileAria: string;
  settingsTitle: string;
  presetsTitle: string;
  customTitle: string;
  rowsLabel: string;
  colsLabel: string;
  previewTitle: string;
  dimensionsLabel: string;
  gridSummary: string;
  sliceDownload: string;
  slicing: string;
  replaceImage: string;
  privacyLabel: string;
  invalidFile: string;
  errorGeneric: string;
  errorTooSmall: string;
  successHint: string;
  pageTitle: string;
  presetLabels: Record<(typeof GRID_PRESETS)[number]["id"] | "custom", string>;
};

type ImageGridSplitterProps = {
  labels: ImageGridSplitterLabels;
  className?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.heic";

export function ImageGridSplitter({ labels, className }: ImageGridSplitterProps) {
  const rowsId = useId();
  const colsId = useId();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [preset, setPreset] = useState<GridPresetId>("3x3");
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const grid = presetToGrid(preset, customRows, customCols);

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
    imageRef.current = null;
    setPreviewUrl(null);
  }, []);

  const drawPreview = useCallback(() => {
    const canvas = previewRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const maxEdge = 720;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.max(1, Math.round(image.naturalWidth * scale));
    const h = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);

    const { rows, cols } = grid;
    ctx.strokeStyle = "rgba(248, 250, 252, 0.92)";
    ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.003));
    ctx.setLineDash([6, 4]);

    for (let c = 1; c < cols; c++) {
      const x = Math.round((w * c) / cols);
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      const y = Math.round((h * r) / rows);
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
    const labelH = Math.max(14, Math.round(h * 0.035));
    ctx.font = `600 ${labelH}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let index = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = ((c + 0.5) * w) / cols;
        const cy = ((r + 0.5) * h) / rows;
        const text = String(index);
        const pad = 6;
        const metrics = ctx.measureText(text);
        const bw = metrics.width + pad * 2;
        const bh = labelH + pad;
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        ctx.fillStyle = "#f8fafc";
        ctx.fillText(text, cx, cy);
        index += 1;
      }
    }
  }, [grid]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview, previewUrl]);

  const reset = useCallback(() => {
    setFile(null);
    setDimensions(null);
    setError(null);
    setBusy(false);
    setProgress(null);
    setCompleted(false);
    revoke();
  }, [revoke]);

  const loadFile = async (next: File) => {
    if (!isAcceptedImageFile(next)) {
      setError(labels.invalidFile);
      return;
    }
    revoke();
    setBusy(true);
    setError(null);
    setCompleted(false);
    try {
      const loaded = await loadGridSplitterSource(next);
      objectUrlRef.current = loaded.objectUrl;
      imageRef.current = loaded.image;
      setPreviewUrl(loaded.objectUrl);
      setFile(next);
      setDimensions({ w: loaded.width, h: loaded.height });
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming || []);
    const accepted = list.find(isAcceptedImageFile) ?? list[0];
    if (!accepted) {
      setError(labels.invalidFile);
      return;
    }
    void loadFile(accepted);
  };

  const onSlice = async () => {
    const image = imageRef.current;
    if (!file || !image) return;

    const nextGrid = normalizeGrid(grid.rows, grid.cols);
    if (
      Math.floor(image.naturalWidth / nextGrid.cols) < 1 ||
      Math.floor(image.naturalHeight / nextGrid.rows) < 1
    ) {
      setError(labels.errorTooSmall);
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(labels.slicing);
    try {
      const result = await splitImageIntoGrid(image, file, nextGrid, (done, total) => {
        setProgress(`${labels.slicing} ${done}/${total}`);
      });
      downloadBlob(result.zipBlob, result.zipName);
      setCompleted(true);
      setProgress(null);
    } catch {
      setError(labels.errorGeneric);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  const summary = labels.gridSummary
    .replace("{rows}", String(grid.rows))
    .replace("{cols}", String(grid.cols))
    .replace("{count}", String(grid.rows * grid.cols));

  return (
    <div className={clsx("image-grid-splitter", className)}>
      {!file || !previewUrl ? (
        <ImageToolDropzone
          dropTitle={labels.dropTitle}
          selectLabel={labels.selectFile}
          selectAria={labels.selectFileAria}
          dropHint={labels.dropHint}
          supportedFormats={["JPG", "PNG", "WebP", "GIF", "HEIC"]}
          privacyLabel={labels.privacyLabel}
          accept={ACCEPT}
          disabled={busy}
          onFiles={onFiles}
        />
      ) : (
        <div className="image-grid-splitter__layout">
          <section className="image-grid-splitter__preview">
            <h2 className="image-grid-splitter__section-title">{labels.previewTitle}</h2>
            <Magnifier zoom={2} size={160} shape="rounded">
            <div className="image-grid-splitter__canvas-wrap">
              <canvas ref={previewRef} className="image-grid-splitter__canvas" />
            </div>
            </Magnifier>
            {dimensions ? (
              <p className="image-grid-splitter__meta">
                {labels.dimensionsLabel
                  .replace("{width}", String(dimensions.w))
                  .replace("{height}", String(dimensions.h))}
              </p>
            ) : null}
            <p className="image-grid-splitter__meta">{summary}</p>
            <button type="button" className="image-grid-splitter__link-btn" onClick={reset}>
              {labels.replaceImage}
            </button>
          </section>

          <aside className="image-grid-splitter__panel">
            <h2 className="image-grid-splitter__section-title">{labels.settingsTitle}</h2>

            <div className="image-grid-splitter__field">
              <p className="image-grid-splitter__label">{labels.presetsTitle}</p>
              <div className="image-grid-splitter__presets" role="group" aria-label={labels.presetsTitle}>
                {GRID_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={clsx(
                      "image-grid-splitter__preset",
                      preset === item.id && "image-grid-splitter__preset--active",
                    )}
                    onClick={() => {
                      setPreset(item.id);
                      setCustomRows(item.rows);
                      setCustomCols(item.cols);
                    }}
                    disabled={busy}
                  >
                    {labels.presetLabels[item.id]}
                  </button>
                ))}
                <button
                  type="button"
                  className={clsx(
                    "image-grid-splitter__preset",
                    preset === "custom" && "image-grid-splitter__preset--active",
                  )}
                  onClick={() => setPreset("custom")}
                  disabled={busy}
                >
                  {labels.presetLabels.custom}
                </button>
              </div>
            </div>

            <div className="image-grid-splitter__custom">
              <p className="image-grid-splitter__label">{labels.customTitle}</p>
              <div className="image-grid-splitter__custom-row">
                <label htmlFor={rowsId}>{labels.rowsLabel}</label>
                <input
                  id={rowsId}
                  type="number"
                  min={MIN_GRID}
                  max={MAX_GRID}
                  value={customRows}
                  disabled={busy}
                  onChange={(event) => {
                    setCustomRows(Number(event.target.value) || 1);
                    setPreset("custom");
                  }}
                  className="image-grid-splitter__input"
                />
              </div>
              <div className="image-grid-splitter__custom-row">
                <label htmlFor={colsId}>{labels.colsLabel}</label>
                <input
                  id={colsId}
                  type="number"
                  min={MIN_GRID}
                  max={MAX_GRID}
                  value={customCols}
                  disabled={busy}
                  onChange={(event) => {
                    setCustomCols(Number(event.target.value) || 1);
                    setPreset("custom");
                  }}
                  className="image-grid-splitter__input"
                />
              </div>
            </div>

            {error ? <p className="image-grid-splitter__error">{error}</p> : null}
            {progress ? <p className="image-grid-splitter__progress">{progress}</p> : null}

            <div className="image-grid-splitter__actions">
              <button
                type="button"
                className={clsx(imBtnCta, "image-grid-splitter__primary")}
                disabled={busy}
                onClick={() => void onSlice()}
              >
                {busy ? (
                  <>
                    <Loader2 className="image-grid-splitter__spinner" aria-hidden />
                    {labels.slicing}
                  </>
                ) : (
                  labels.sliceDownload
                )}
              </button>
            </div>

            {completed ? (
              <>
                <p className="image-grid-splitter__success">{labels.successHint}</p>
                <ToolSuccessEngagement
                  pageTitle={labels.pageTitle}
                  fileContext={file.name}
                  className="image-grid-splitter__engagement"
                />
              </>
            ) : null}

            <p className="image-grid-splitter__privacy">{labels.privacyLabel}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
