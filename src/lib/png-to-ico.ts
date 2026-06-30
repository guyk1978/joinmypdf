import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import {
  encodeIcoBlob,
  FAVICON_EXPORT_SIZES,
  downloadBlob,
} from "@/lib/generate-favicon";

export { downloadBlob };

const PNG_MIME = "image/png";

export function isAcceptedPngFile(file: File): boolean {
  if (file.type === PNG_MIME) return true;
  return /\.png$/i.test(file.name);
}

export function pngToIcoOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  return `${base}.ico`;
}

export function drawImageToSquareCanvas(image: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);
  const scale = Math.max(size / width, size / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  return canvas;
}

export async function convertPngImageToIco(imageSrc: string): Promise<Blob> {
  const image = await createImage(imageSrc);
  const frames = FAVICON_EXPORT_SIZES.map((size) => ({
    size,
    canvas: drawImageToSquareCanvas(image, size),
  }));
  return encodeIcoBlob(frames);
}

export async function convertPngFileToIco(file: File): Promise<Blob> {
  if (!isAcceptedPngFile(file)) {
    throw new Error("Invalid PNG file.");
  }
  const imageSrc = await loadImageFileForCrop(file);
  try {
    return await convertPngImageToIco(imageSrc);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

export async function loadPngFileForPreview(file: File): Promise<string> {
  if (!isAcceptedPngFile(file)) {
    throw new Error("Invalid PNG file.");
  }
  return loadImageFileForCrop(file);
}
