/**
 * Local Image Grid Splitter — canvas crop tiles + JSZip package.
 * Pixel-perfect slices; no quality loss for PNG (JPEG uses high-quality encode).
 */

import {
  createImage,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "@/lib/crop-image";

export { isAcceptedImageFile, downloadBlob } from "@/lib/crop-image";

export const GRID_PRESETS = [
  { id: "2x2", rows: 2, cols: 2 },
  { id: "3x3", rows: 3, cols: 3 },
  { id: "1x3", rows: 1, cols: 3 },
  { id: "3x1", rows: 3, cols: 1 },
] as const;

export type GridPresetId = (typeof GRID_PRESETS)[number]["id"] | "custom";

export const MIN_GRID = 1;
export const MAX_GRID = 10;

export type GridConfig = {
  rows: number;
  cols: number;
};

export type SplitTile = {
  row: number;
  col: number;
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
};

export type SplitImageResult = {
  tiles: SplitTile[];
  zipBlob: Blob;
  zipName: string;
  width: number;
  height: number;
};

function clampGrid(value: number): number {
  return Math.max(MIN_GRID, Math.min(MAX_GRID, Math.round(value)));
}

export function normalizeGrid(rows: number, cols: number): GridConfig {
  return { rows: clampGrid(rows), cols: clampGrid(cols) };
}

export function presetToGrid(id: GridPresetId, customRows: number, customCols: number): GridConfig {
  if (id === "custom") return normalizeGrid(customRows, customCols);
  const preset = GRID_PRESETS.find((item) => item.id === id);
  return preset ? { rows: preset.rows, cols: preset.cols } : normalizeGrid(customRows, customCols);
}

export async function loadGridSplitterSource(file: File): Promise<{
  objectUrl: string;
  image: HTMLImageElement;
  width: number;
  height: number;
}> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("Unsupported image");
  }
  const objectUrl = await loadImageFileForCrop(file);
  try {
    const image = await createImage(objectUrl);
    return {
      objectUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function preferJpeg(file: File): boolean {
  const type = file.type.toLowerCase();
  return type === "image/jpeg" || type === "image/jpg" || /\.jpe?g$/i.test(file.name);
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Export failed"));
      },
      mime,
      quality,
    );
  });
}

function yieldFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function tileFileName(
  sourceName: string,
  row: number,
  col: number,
  rows: number,
  cols: number,
  ext: string,
): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 60);
  const r = String(row + 1).padStart(2, "0");
  const c = String(col + 1).padStart(2, "0");
  return `${safe}_${rows}x${cols}_r${r}_c${c}.${ext}`;
}

export function zipOutputName(sourceName: string, rows: number, cols: number): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 60);
  return `${safe}-${rows}x${cols}-grid.zip`;
}

/**
 * Slice image into a rows×cols grid. Remainder pixels are absorbed into the
 * last row/column so the full image is covered without gaps or overlap.
 */
export async function splitImageIntoGrid(
  image: HTMLImageElement,
  file: File,
  grid: GridConfig,
  onProgress?: (done: number, total: number) => void,
): Promise<SplitImageResult> {
  const { rows, cols } = normalizeGrid(grid.rows, grid.cols);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width < 1 || height < 1) throw new Error("Invalid image dimensions");

  const baseTileW = Math.floor(width / cols);
  const baseTileH = Math.floor(height / rows);
  if (baseTileW < 1 || baseTileH < 1) {
    throw new Error("Image too small for this grid");
  }

  const useJpeg = preferJpeg(file);
  const mime = useJpeg ? "image/jpeg" : "image/png";
  const ext = useJpeg ? "jpg" : "png";
  const quality = useJpeg ? 0.95 : undefined;

  const tiles: SplitTile[] = [];
  const total = rows * cols;
  let done = 0;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");

  for (let row = 0; row < rows; row++) {
    const y = row * baseTileH;
    const h = row === rows - 1 ? height - y : baseTileH;
    for (let col = 0; col < cols; col++) {
      const x = col * baseTileW;
      const w = col === cols - 1 ? width - x : baseTileW;

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(image, x, y, w, h, 0, 0, w, h);

      const blob = await canvasToBlob(canvas, mime, quality);
      tiles.push({
        row,
        col,
        blob,
        fileName: tileFileName(file.name, row, col, rows, cols, ext),
        width: w,
        height: h,
      });

      done += 1;
      onProgress?.(done, total);
      if (done % 2 === 0) await yieldFrame();
    }
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const tile of tiles) {
    zip.file(tile.fileName, await tile.blob.arrayBuffer());
  }
  const zipBlob = (await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })) as Blob;

  return {
    tiles,
    zipBlob,
    zipName: zipOutputName(file.name, rows, cols),
    width,
    height,
  };
}
