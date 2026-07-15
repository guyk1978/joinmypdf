import { createImage, downloadBlob, isAcceptedImageFile, loadImageFileForCrop } from "@/lib/crop-image";

export { downloadBlob, isAcceptedImageFile, loadImageFileForCrop };

/** Legacy orthogonal snaps still used by quick-rotate helpers. */
export type RotationDegrees = 0 | 90 | 180 | 270;

export type ImageTransform = {
  /** Clockwise degrees — any finite number. */
  degrees: number;
  flipX: boolean;
  flipY: boolean;
};

const JPEG_QUALITY = 0.92;

export function normalizeRotation(degrees: number): RotationDegrees {
  const normalized = ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }
  return 0;
}

/** Normalize to (-180, 180] for display/deskew merging. */
export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  let value = degrees % 360;
  if (value > 180) value -= 360;
  if (value <= -180) value += 360;
  return Math.round(value * 100) / 100;
}

function outputMimeForFile(file: File): { mime: string; quality?: number } {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();

  if (type === "image/jpeg" || ext === "jpg" || ext === "jpeg") {
    return { mime: "image/jpeg", quality: JPEG_QUALITY };
  }
  if (type === "image/webp" || ext === "webp") {
    return { mime: "image/webp", quality: JPEG_QUALITY };
  }
  if (type === "image/png" || ext === "png") {
    return { mime: "image/png" };
  }
  if (type === "image/gif" || ext === "gif") {
    return { mime: "image/png" };
  }

  return { mime: "image/png" };
}

export function rotateImageOutputName(sourceName: string, mime: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";

  if (mime === "image/jpeg") return `${base}-rotated.jpg`;
  if (mime === "image/webp") return `${base}-rotated.webp`;
  return `${base}-rotated.png`;
}

function canvasToBlob(canvas: HTMLCanvasElement, file: File): Promise<Blob> {
  const { mime, quality } = outputMimeForFile(file);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export transformed image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

function rotatedBounds(width: number, height: number, radians: number): { width: number; height: number } {
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    width: Math.max(1, Math.ceil(width * cos + height * sin)),
    height: Math.max(1, Math.ceil(width * sin + height * cos)),
  };
}

/** Apply rotation + flips on a canvas and export a blob (local-first). */
export async function getTransformedImageBlob(
  imageSrc: string,
  transform: ImageTransform,
  file: File,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const srcW = Math.max(1, image.naturalWidth || image.width);
  const srcH = Math.max(1, image.naturalHeight || image.height);
  const degrees = normalizeDegrees(transform.degrees);
  const radians = (degrees * Math.PI) / 180;
  const bounds = rotatedBounds(srcW, srcH, radians);

  canvas.width = bounds.width;
  canvas.height = bounds.height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(bounds.width / 2, bounds.height / 2);
  ctx.rotate(radians);
  ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
  ctx.drawImage(image, -srcW / 2, -srcH / 2, srcW, srcH);

  return canvasToBlob(canvas, file);
}

export async function getRotatedImageBlob(
  imageSrc: string,
  rotation: RotationDegrees,
  file: File,
): Promise<Blob> {
  return getTransformedImageBlob(imageSrc, { degrees: rotation, flipX: false, flipY: false }, file);
}
