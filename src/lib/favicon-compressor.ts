import { createImage } from "@/lib/crop-image";
import {
  compressionSavingsPercent,
  formatBytes,
} from "@/lib/compress-image";
import { isAcceptedFaviconPackFile } from "@/lib/favicon-pack";
import { canvasToPngBlob, downloadBlob, encodeIcoBlob } from "@/lib/generate-favicon";
import {
  isAcceptedIcoFile,
  parseIcoFile,
  revokeIcoFrames,
} from "@/lib/ico-to-png";

export { compressionSavingsPercent, downloadBlob, formatBytes };

export type FaviconCompressorResult = {
  blob: Blob;
  originalBytes: number;
  compressedBytes: number;
  mime: string;
};

export function isAcceptedFaviconCompressorFile(file: File): boolean {
  return isAcceptedIcoFile(file) || isAcceptedFaviconPackFile(file);
}

export function isIcoFaviconSource(file: File): boolean {
  return isAcceptedIcoFile(file);
}

export function isJpegFaviconSource(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") return true;
  return /\.jpe?g$/i.test(file.name);
}

export function faviconCompressorOutputName(sourceName: string, mime: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  if (
    mime === "image/x-icon" ||
    mime === "image/vnd.microsoft.icon" ||
    /\.ico$/i.test(sourceName)
  ) {
    return `${base}-optimized.ico`;
  }
  if (mime === "image/jpeg") return `${base}-optimized.jpg`;
  return `${base}-optimized.png`;
}

function bucketChannel(value: number, bits: number): number {
  const levels = 1 << bits;
  const step = 255 / (levels - 1);
  return Math.min(255, Math.round(value / step) * Math.round(step));
}

function quantizeImageData(data: ImageData, rgbBits: number): void {
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = bucketChannel(pixels[i] ?? 0, rgbBits);
    pixels[i + 1] = bucketChannel(pixels[i + 1] ?? 0, rgbBits);
    pixels[i + 2] = bucketChannel(pixels[i + 2] ?? 0, rgbBits);
  }
}

function canvasHasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 255) < 255) return true;
  }
  return false;
}

function drawImageToCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("JPEG export failed."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function pickSmallerBlob(candidates: Blob[]): Promise<Blob> {
  if (!candidates.length) {
    throw new Error("No compressed output candidates.");
  }
  return candidates.reduce((best, current) => (current.size < best.size ? current : best));
}

async function optimizePngCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const candidates: Blob[] = [await canvasToPngBlob(canvas)];

  if (width * height <= 256 * 256) {
    const hasAlpha = canvasHasTransparency(ctx, width, height);
    const bitsOptions = hasAlpha ? [5, 6] : [5, 6, 7];

    for (const bits of bitsOptions) {
      const quantized = document.createElement("canvas");
      quantized.width = width;
      quantized.height = height;
      const qCtx = quantized.getContext("2d");
      if (!qCtx) continue;

      qCtx.drawImage(canvas, 0, 0);
      const imageData = qCtx.getImageData(0, 0, width, height);
      quantizeImageData(imageData, bits);
      qCtx.putImageData(imageData, 0, 0);
      candidates.push(await canvasToPngBlob(quantized));
    }
  }

  return pickSmallerBlob(candidates);
}

async function optimizeJpegCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  const qualities = [0.92, 0.88, 0.85, 0.82, 0.78];
  const candidates: Blob[] = [];

  for (const quality of qualities) {
    candidates.push(await canvasToJpegBlob(canvas, quality));
  }

  return pickSmallerBlob(candidates);
}

async function blobToCanvas(blob: Blob, width: number, height: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await createImage(url);
    return drawImageToCanvas(image, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressRasterImage(file: File, imageSrc: string): Promise<Blob> {
  const image = await createImage(imageSrc);
  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);
  const canvas = drawImageToCanvas(image, width, height);

  if (isJpegFaviconSource(file)) {
    return optimizeJpegCanvas(canvas);
  }

  return optimizePngCanvas(canvas);
}

async function compressIcoFile(file: File): Promise<Blob> {
  const frames = await parseIcoFile(file);

  try {
    const optimizedFrames: { size: number; canvas: HTMLCanvasElement }[] = [];

    for (const frame of frames) {
      const canvas = await blobToCanvas(frame.pngBlob, frame.width, frame.height);
      const optimizedPng = await optimizePngCanvas(canvas);
      const optimizedCanvas = await blobToCanvas(optimizedPng, frame.width, frame.height);
      optimizedFrames.push({
        size: Math.max(frame.width, frame.height),
        canvas: optimizedCanvas,
      });
    }

    return encodeIcoBlob(optimizedFrames);
  } finally {
    revokeIcoFrames(frames);
  }
}

export async function compressFaviconFile(file: File, imageSrc?: string): Promise<FaviconCompressorResult> {
  const originalBytes = file.size;

  if (isIcoFaviconSource(file)) {
    const blob = await compressIcoFile(file);
    return {
      blob,
      originalBytes,
      compressedBytes: blob.size,
      mime: "image/x-icon",
    };
  }

  const src = imageSrc ?? URL.createObjectURL(file);
  const shouldRevoke = !imageSrc;

  try {
    const blob = await compressRasterImage(file, src);
    return {
      blob,
      originalBytes,
      compressedBytes: blob.size,
      mime: blob.type,
    };
  } finally {
    if (shouldRevoke) URL.revokeObjectURL(src);
  }
}

export async function loadFaviconCompressorPreview(file: File): Promise<{
  previewUrl: string;
  kind: "raster" | "ico";
  frameCount?: number;
}> {
  if (isIcoFaviconSource(file)) {
    const frames = await parseIcoFile(file);
    const largest = frames[0];
    if (!largest) {
      revokeIcoFrames(frames);
      throw new Error("No icons found in this ICO file.");
    }

    const previewUrl = URL.createObjectURL(largest.pngBlob);
    revokeIcoFrames(frames);
    return { previewUrl, kind: "ico", frameCount: frames.length };
  }

  if (!isAcceptedFaviconPackFile(file)) {
    throw new Error("Invalid favicon file.");
  }

  const previewUrl = URL.createObjectURL(file);
  return { previewUrl, kind: "raster" };
}
