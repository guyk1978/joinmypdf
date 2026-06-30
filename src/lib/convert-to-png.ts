import { createImage, downloadBlob, isAcceptedImageFile, loadImageFileForCrop } from "@/lib/crop-image";

export { downloadBlob, isAcceptedImageFile, loadImageFileForCrop };

const MIME_PNG = "image/png";

export function convertToPngOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  return `${base}.png`;
}

export async function convertImageToPngBlob(imageSrc: string): Promise<Blob> {
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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export PNG."));
          return;
        }
        resolve(blob);
      },
      MIME_PNG,
    );
  });
}

export async function convertImageFileToPng(file: File): Promise<Blob> {
  const imageSrc = await loadImageFileForCrop(file);
  try {
    return await convertImageToPngBlob(imageSrc);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}
