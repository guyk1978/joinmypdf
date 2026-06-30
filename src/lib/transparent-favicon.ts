import { createImage } from "@/lib/crop-image";
import { isAcceptedFaviconPackFile } from "@/lib/favicon-pack";
import { canvasToPngBlob, downloadBlob } from "@/lib/generate-favicon";

export { downloadBlob };

export const DEFAULT_TRANSPARENT_COLOR_TOLERANCE = 32;

export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export function isAcceptedTransparentFaviconFile(file: File): boolean {
  return isAcceptedFaviconPackFile(file);
}

export function transparentFaviconOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  return `${base}-transparent.png`;
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
