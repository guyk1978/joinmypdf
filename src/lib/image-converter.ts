import {
  createImage,
  downloadBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "@/lib/crop-image";
import type {
  ImageConverterWorkerRequest,
  ImageConverterWorkerResponse,
} from "@/workers/image-converter.worker";

export { downloadBlob, isAcceptedImageFile };

export type ImageConverterFormat = "webp" | "png" | "jpg" | "heic";

export type ImageConverterResult = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  /** True when HEIC was requested but browsers cannot encode HEIC — JPEG was exported instead. */
  heicEncodeFallback: boolean;
  usedWorker: boolean;
};

export type ConvertImageOptions = {
  format: ImageConverterFormat;
  /** 0–1 for lossy formats (WebP / JPG). Ignored for PNG. */
  quality?: number;
  onProgress?: (percent: number) => void;
};

const WORKER_PIXEL_THRESHOLD = 2_000_000;
const WORKER_BYTE_THRESHOLD = 1.5 * 1024 * 1024;
const DEFAULT_QUALITY = 0.92;

const OUTPUT_FORMATS: readonly ImageConverterFormat[] = ["webp", "png", "jpg", "heic"];

export function isImageConverterFormat(value: string): value is ImageConverterFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value);
}

export function imageConverterFormats(): readonly ImageConverterFormat[] {
  return OUTPUT_FORMATS;
}

export function resolveOutputSpec(format: ImageConverterFormat): {
  mimeType: string;
  extension: string;
  heicEncodeFallback: boolean;
} {
  if (format === "webp") {
    return { mimeType: "image/webp", extension: "webp", heicEncodeFallback: false };
  }
  if (format === "png") {
    return { mimeType: "image/png", extension: "png", heicEncodeFallback: false };
  }
  if (format === "jpg") {
    return { mimeType: "image/jpeg", extension: "jpg", heicEncodeFallback: false };
  }
  // Browsers cannot encode HEIC/HEIF. Export high-quality JPEG instead.
  return { mimeType: "image/jpeg", extension: "jpg", heicEncodeFallback: true };
}

export function imageConverterOutputName(
  sourceName: string,
  format: ImageConverterFormat,
): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const { extension } = resolveOutputSpec(format);
  return `${slug}.${extension}`;
}

export function detectImageFormatLabel(file: File): string {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toUpperCase();
  if (type === "image/jpeg" || ext === "JPG" || ext === "JPEG") return "JPEG";
  if (type === "image/png" || ext === "PNG") return "PNG";
  if (type === "image/webp" || ext === "WEBP") return "WEBP";
  if (type === "image/gif" || ext === "GIF") return "GIF";
  if (type === "image/heic" || type === "image/heif" || ext === "HEIC" || ext === "HEIF") {
    return "HEIC";
  }
  if (type === "image/bmp" || ext === "BMP") return "BMP";
  return ext || "IMAGE";
}

function clampQuality(quality: number | undefined): number {
  if (!Number.isFinite(quality)) return DEFAULT_QUALITY;
  return Math.min(1, Math.max(0.05, quality as number));
}

function shouldUseWorker(fileBytes: number, width: number, height: number): boolean {
  if (typeof Worker === "undefined") return false;
  if (typeof OffscreenCanvas === "undefined") return false;
  if (typeof createImageBitmap !== "function") return false;
  const pixels = width * height;
  return pixels >= WORKER_PIXEL_THRESHOLD || fileBytes >= WORKER_BYTE_THRESHOLD;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode the converted image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      mimeType === "image/png" ? undefined : quality,
    );
  });
}

async function convertOnMainThread(
  imageSrc: string,
  mimeType: string,
  quality: number,
  onProgress?: (percent: number) => void,
): Promise<{ blob: Blob; width: number; height: number }> {
  onProgress?.(30);
  const image = await createImage(imageSrc);
  const width = Math.max(1, image.naturalWidth || image.width);
  const height = Math.max(1, image.naturalHeight || image.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);
  onProgress?.(75);

  const blob = await canvasToBlob(canvas, mimeType, quality);
  onProgress?.(100);
  return { blob, width, height };
}

function runWorkerConvert(
  bitmap: ImageBitmap,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/image-converter.worker.ts", import.meta.url),
      { type: "module" },
    );

    const cleanup = () => {
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<ImageConverterWorkerResponse>) => {
      cleanup();
      const data = event.data;
      if (data.type === "ok") {
        resolve(new Blob([data.buffer], { type: data.mimeType }));
        return;
      }
      reject(new Error(data.message || "Worker conversion failed."));
    };

    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Worker conversion failed."));
    };

    const payload: ImageConverterWorkerRequest = {
      type: "convert",
      bitmap,
      mimeType,
      quality,
    };
    worker.postMessage(payload, [bitmap]);
  });
}

async function convertWithWorker(
  imageSrc: string,
  mimeType: string,
  quality: number,
  onProgress?: (percent: number) => void,
): Promise<{ blob: Blob; width: number; height: number }> {
  onProgress?.(25);
  const response = await fetch(imageSrc);
  const sourceBlob = await response.blob();
  const bitmap = await createImageBitmap(sourceBlob);
  const width = Math.max(1, bitmap.width);
  const height = Math.max(1, bitmap.height);
  onProgress?.(55);

  try {
    const blob = await runWorkerConvert(bitmap, mimeType, quality);
    onProgress?.(100);
    return { blob, width, height };
  } catch {
    // Worker failed after transferring the bitmap — fall back via main-thread decode.
    onProgress?.(40);
    return convertOnMainThread(imageSrc, mimeType, quality, onProgress);
  }
}

/**
 * Convert an image file to WebP, PNG, or JPG in the browser.
 * HEIC/HEIF inputs are decoded with heic2any. Requesting HEIC output falls back to JPEG
 * because browsers cannot encode HEIC.
 */
export async function convertImageFile(
  file: File,
  options: ConvertImageOptions,
): Promise<ImageConverterResult> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("Please choose a supported image file.");
  }

  const quality = clampQuality(options.quality);
  const { mimeType, heicEncodeFallback } = resolveOutputSpec(options.format);
  const onProgress = options.onProgress;

  onProgress?.(5);
  const imageSrc = await loadImageFileForCrop(file);
  onProgress?.(20);

  try {
    const probe = await createImage(imageSrc);
    const width = Math.max(1, probe.naturalWidth || probe.width);
    const height = Math.max(1, probe.naturalHeight || probe.height);
    const useWorker = shouldUseWorker(file.size, width, height);

    const encoded = useWorker
      ? await convertWithWorker(imageSrc, mimeType, quality, onProgress)
      : await convertOnMainThread(imageSrc, mimeType, quality, onProgress);

    return {
      blob: encoded.blob,
      fileName: imageConverterOutputName(file.name, options.format),
      mimeType,
      width: encoded.width,
      height: encoded.height,
      heicEncodeFallback,
      usedWorker: useWorker,
    };
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}
