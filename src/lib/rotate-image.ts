import { createImage, downloadBlob, isAcceptedImageFile, loadImageFileForCrop } from "@/lib/crop-image";

export { downloadBlob, isAcceptedImageFile, loadImageFileForCrop };

export type RotationDegrees = 0 | 90 | 180 | 270;

const JPEG_QUALITY = 0.92;

export function normalizeRotation(degrees: number): RotationDegrees {
  const normalized = ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }
  return 0;
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

export async function getRotatedImageBlob(
  imageSrc: string,
  rotation: RotationDegrees,
  file: File,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const radians = (rotation * Math.PI) / 180;
  const swap = rotation === 90 || rotation === 270;

  canvas.width = swap ? image.naturalWidth > 0 ? image.naturalHeight : 1 : image.naturalWidth;
  canvas.height = swap ? image.naturalHeight > 0 ? image.naturalWidth : 1 : image.naturalHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const { mime, quality } = outputMimeForFile(file);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export rotated image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}
