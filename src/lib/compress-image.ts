import { createImage, downloadBlob, isAcceptedImageFile, loadImageFileForCrop } from "@/lib/crop-image";
import { formatBytes } from "@/lib/pdf-engine";

export { downloadBlob, formatBytes, isAcceptedImageFile, loadImageFileForCrop };

export const DEFAULT_COMPRESS_QUALITY = 85;
export const MIN_COMPRESS_QUALITY = 1;
export const MAX_COMPRESS_QUALITY = 100;

export function clampCompressQuality(percent: number): number {
  if (!Number.isFinite(percent)) return DEFAULT_COMPRESS_QUALITY;
  return Math.min(MAX_COMPRESS_QUALITY, Math.max(MIN_COMPRESS_QUALITY, Math.round(percent)));
}

export function qualityPercentToFactor(percent: number): number {
  return clampCompressQuality(percent) / 100;
}

type OutputFormat = {
  mime: string;
  quality?: number;
};

function isPngSource(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/png" || ext === "png";
}

function isJpegSource(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/jpeg" || ext === "jpg" || ext === "jpeg";
}

function isWebpSource(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/webp" || ext === "webp";
}

export function outputFormatForCompression(file: File, qualityPercent: number): OutputFormat {
  const quality = qualityPercentToFactor(qualityPercent);

  if (isJpegSource(file)) {
    return { mime: "image/jpeg", quality };
  }

  if (isWebpSource(file)) {
    return { mime: "image/webp", quality };
  }

  if (isPngSource(file)) {
    if (qualityPercent >= MAX_COMPRESS_QUALITY) {
      return { mime: "image/png" };
    }
    return { mime: "image/webp", quality };
  }

  return { mime: "image/jpeg", quality };
}

export function compressImageOutputName(sourceName: string, mime: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";

  if (mime === "image/jpeg") return `${base}-compressed.jpg`;
  if (mime === "image/webp") return `${base}-compressed.webp`;
  return `${base}-compressed.png`;
}

export function compressionSavingsPercent(originalBytes: number, compressedBytes: number): number {
  if (!originalBytes || compressedBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
}

export async function getCompressedImageBlob(
  imageSrc: string,
  qualityPercent: number,
  file: File,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);

  canvas.width = width;
  canvas.height = height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  const { mime, quality } = outputFormatForCompression(file, qualityPercent);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export compressed image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}
