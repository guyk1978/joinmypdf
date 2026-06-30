import { createImage } from "@/lib/crop-image";
import { encodeIcoBlob, downloadBlob } from "@/lib/generate-favicon";

export { downloadBlob };

export const SVG_FAVICON_SIZE_OPTIONS = [32, 48, 64] as const;

export type SvgFaviconOutputSize = (typeof SVG_FAVICON_SIZE_OPTIONS)[number];

const SVG_MIME = "image/svg+xml";

export function isAcceptedSvgFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === SVG_MIME) return true;
  return /\.svg$/i.test(file.name);
}

export function svgToFaviconOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  return `${base}.ico`;
}

export function icoSizesForSelection(selectedSize: SvgFaviconOutputSize): number[] {
  const sizes = [16, 32, 48, 64];
  return sizes.filter((size) => size <= selectedSize);
}

export async function loadSvgPreviewUrl(file: File): Promise<string> {
  if (!isAcceptedSvgFile(file)) {
    throw new Error("Invalid SVG file.");
  }
  const text = await file.text();
  if (!text.trim() || !/<svg[\s>]/i.test(text)) {
    throw new Error("Invalid SVG file.");
  }
  return URL.createObjectURL(new Blob([text], { type: SVG_MIME }));
}

export function drawSvgToSquareCanvas(image: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const width = Math.max(1, image.naturalWidth || image.width);
  const height = Math.max(1, image.naturalHeight || image.height);
  const scale = Math.min(size / width, size / height);
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

export async function convertSvgImageToIco(
  imageSrc: string,
  selectedSize: SvgFaviconOutputSize,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const frames = icoSizesForSelection(selectedSize).map((size) => ({
    size,
    canvas: drawSvgToSquareCanvas(image, size),
  }));
  return encodeIcoBlob(frames);
}
