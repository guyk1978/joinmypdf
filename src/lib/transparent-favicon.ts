import { createImage } from "@/lib/crop-image";
import { isAcceptedFaviconPackFile } from "@/lib/favicon-pack";
import { canvasToPngBlob, downloadBlob } from "@/lib/generate-favicon";

export { downloadBlob };

export const DEFAULT_TRANSPARENT_COLOR_TOLERANCE = 32;

export const TRANSPARENT_FAVICON_EXPORT_OPTIONS = [
  { value: "native" as const, labelKey: "native" },
  { value: 16 as const, labelKey: "size16" },
  { value: 32 as const, labelKey: "size32" },
  { value: 64 as const, labelKey: "size64" },
] as const;

export type TransparentFaviconExportSize =
  (typeof TRANSPARENT_FAVICON_EXPORT_OPTIONS)[number]["value"];

export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export function isAcceptedTransparentFaviconFile(file: File): boolean {
  return isAcceptedFaviconPackFile(file);
}

export function transparentFaviconOutputName(
  sourceName: string,
  outputSize: TransparentFaviconExportSize = "native",
): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  if (outputSize === "native") return `${base}-transparent.png`;
  return `${base}-transparent-${outputSize}x${outputSize}.png`;
}

export function matchesTargetColor(
  r: number,
  g: number,
  b: number,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number,
): boolean {
  return (
    Math.abs(r - targetR) <= tolerance &&
    Math.abs(g - targetG) <= tolerance &&
    Math.abs(b - targetB) <= tolerance
  );
}

export function applyColorsToAlpha(
  source: ImageData,
  targets: RgbColor[],
  tolerance: number,
): ImageData {
  const output = new ImageData(source.width, source.height);
  const src = source.data;
  const dst = output.data;

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i] ?? 0;
    const g = src[i + 1] ?? 0;
    const b = src[i + 2] ?? 0;
    const alpha = src[i + 3] ?? 255;

    const shouldClear = targets.some((target) =>
      matchesTargetColor(r, g, b, target.r, target.g, target.b, tolerance),
    );

    if (shouldClear) {
      dst[i] = 0;
      dst[i + 1] = 0;
      dst[i + 2] = 0;
      dst[i + 3] = 0;
    } else {
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = alpha;
    }
  }

  return output;
}

export async function loadTransparentFaviconImageData(
  imageSrc: string,
): Promise<{ imageData: ImageData; width: number; height: number }> {
  const image = await createImage(imageSrc);
  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  ctx.drawImage(image, 0, 0, width, height);
  return {
    imageData: ctx.getImageData(0, 0, width, height),
    width,
    height,
  };
}

export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  ctx.putImageData(imageData, 0, 0);
  return canvasToPngBlob(canvas);
}

export async function exportTransparentFaviconPng(
  imageData: ImageData,
  outputSize: TransparentFaviconExportSize,
): Promise<Blob> {
  if (outputSize === "native") {
    return imageDataToPngBlob(imageData);
  }

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  sourceCtx.putImageData(imageData, 0, 0);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  outputCtx.drawImage(
    sourceCanvas,
    0,
    0,
    imageData.width,
    imageData.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvasToPngBlob(outputCanvas);
}

export function sampleColorAtPixel(
  imageData: ImageData,
  x: number,
  y: number,
): RgbColor | null {
  const px = Math.min(imageData.width - 1, Math.max(0, Math.floor(x)));
  const py = Math.min(imageData.height - 1, Math.max(0, Math.floor(y)));
  const index = (py * imageData.width + px) * 4;
  const data = imageData.data;

  return {
    r: data[index] ?? 0,
    g: data[index + 1] ?? 0,
    b: data[index + 2] ?? 0,
  };
}

export function formatRgbColor(color: RgbColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function quantizeChannel(value: number, bucket = 8): number {
  return Math.min(255, Math.round(value / bucket) * bucket);
}

function colorBucketKey(color: RgbColor): string {
  return `${quantizeChannel(color.r)},${quantizeChannel(color.g)},${quantizeChannel(color.b)}`;
}

export function colorsMatch(a: RgbColor, b: RgbColor, tolerance = DEFAULT_TRANSPARENT_COLOR_TOLERANCE): boolean {
  return matchesTargetColor(a.r, a.g, a.b, b.r, b.g, b.b, tolerance);
}

export function detectDominantBackgroundColor(imageData: ImageData): RgbColor | null {
  const { width, height, data } = imageData;
  if (width < 1 || height < 1) return null;

  const counts = new Map<string, { count: number; color: RgbColor }>();

  const addSample = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    const color: RgbColor = {
      r: data[index] ?? 0,
      g: data[index + 1] ?? 0,
      b: data[index + 2] ?? 0,
    };
    const key = colorBucketKey(color);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, color });
    }
  };

  addSample(0, 0);
  addSample(width - 1, 0);
  addSample(0, height - 1);
  addSample(width - 1, height - 1);

  const stepX = Math.max(1, Math.floor(width / 24));
  const stepY = Math.max(1, Math.floor(height / 24));

  for (let x = 0; x < width; x += stepX) {
    addSample(x, 0);
    addSample(x, height - 1);
  }

  for (let y = 0; y < height; y += stepY) {
    addSample(0, y);
    addSample(width - 1, y);
  }

  let dominant: { count: number; color: RgbColor } | null = null;
  for (const entry of counts.values()) {
    if (!dominant || entry.count > dominant.count) {
      dominant = entry;
    }
  }

  return dominant?.color ?? null;
}
