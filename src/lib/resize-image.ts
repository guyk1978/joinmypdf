import { createImage, downloadBlob, loadImageFileForCrop, isAcceptedImageFile } from "@/lib/crop-image";

export { downloadBlob, isAcceptedImageFile, loadImageFileForCrop };

export type ResizeDimensions = {
  width: number;
  height: number;
};

const JPEG_QUALITY = 0.92;

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

export function resizeImageOutputName(sourceName: string, mime: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";

  if (mime === "image/jpeg") return `${base}-resized.jpg`;
  if (mime === "image/webp") return `${base}-resized.webp`;
  return `${base}-resized.png`;
}

export async function getResizedImageBlob(
  imageSrc: string,
  dimensions: ResizeDimensions,
  file: File,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const width = Math.max(1, Math.round(dimensions.width));
  const height = Math.max(1, Math.round(dimensions.height));

  canvas.width = width;
  canvas.height = height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  const { mime, quality } = outputMimeForFile(file);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export resized image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export function clampDimension(value: number, min = 1, max = 16000): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function dimensionsWithAspect(
  source: ResizeDimensions,
  changed: "width" | "height",
  aspectRatio: number,
): ResizeDimensions {
  if (changed === "width") {
    return {
      width: source.width,
      height: clampDimension(source.width / aspectRatio),
    };
  }

  return {
    width: clampDimension(source.height * aspectRatio),
    height: source.height,
  };
}
