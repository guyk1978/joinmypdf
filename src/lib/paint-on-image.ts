import {
  createImage,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "./crop-image";
import { classifyPdfError, PdfProcessingError } from "./pdf-errors";

export { isAcceptedImageFile };

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 50;
export const DEFAULT_BRUSH_SIZE = 8;
export const DEFAULT_BRUSH_COLOR = "#ffffff";
export const MAX_UNDO_STATES = 30;

export function clampBrushSize(size: number): number {
  if (!Number.isFinite(size)) return DEFAULT_BRUSH_SIZE;
  return Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, Math.round(size)));
}

export function paintOnImageOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  return `${slug}-painted.png`;
}

export type LoadedPaintImage = {
  image: HTMLImageElement;
  objectUrl: string;
  width: number;
  height: number;
};

/** Load an image file for painting (handles HEIC locally). */
export async function loadPaintImage(file: File): Promise<LoadedPaintImage> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("Choose a supported image file (JPG, PNG, WebP, HEIC, or GIF).");
  }
  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty.`);
  }

  try {
    const objectUrl = await loadImageFileForCrop(file);
    const image = await createImage(objectUrl);
    const width = Math.max(1, image.naturalWidth || image.width);
    const height = Math.max(1, image.naturalHeight || image.height);
    return { image, objectUrl, width, height };
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export function getMousePos(
  canvas: HTMLCanvasElement,
  evt: { clientX: number; clientY: number },
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

/** @deprecated Use getMousePos — kept for transitional imports. */
export const mapPointerToCanvas = getMousePos;

export function drawImageOnCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  canvas.width = Math.max(1, image.naturalWidth || image.width);
  canvas.height = Math.max(1, image.naturalHeight || image.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return ctx;
}

export function canvasSnapshot(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

export async function restoreCanvasSnapshot(
  canvas: HTMLCanvasElement,
  snapshot: string,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const image = await createImage(snapshot);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

export async function exportPaintedCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export painted image."));
          return;
        }
        resolve(blob);
      },
      "image/png",
    );
  });
}
