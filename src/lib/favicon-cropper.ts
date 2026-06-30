import {
  createImage,
  getCroppedImageBlob,
  loadImageFileForCrop,
  type PixelCrop,
} from "@/lib/crop-image";
import type { NormalizedCropRect } from "@/lib/crop-pdf";
import { canvasToPngBlob, downloadBlob } from "@/lib/generate-favicon";
import { isAcceptedFaviconPackFile } from "@/lib/favicon-pack";
import { isAcceptedSvgFile, loadSvgPreviewUrl } from "@/lib/svg-to-favicon";

export { downloadBlob };

export const FAVICON_CROP_MIN_FRACTION = 0.08;

export const FAVICON_CROP_OUTPUT_OPTIONS = [
  { value: "native" as const, labelKey: "native" },
  { value: 32 as const, labelKey: "size32" },
  { value: 48 as const, labelKey: "size48" },
] as const;

export type FaviconCropOutputSize = (typeof FAVICON_CROP_OUTPUT_OPTIONS)[number]["value"];

export function isAcceptedFaviconCropFile(file: File): boolean {
  return isAcceptedFaviconPackFile(file) || isAcceptedSvgFile(file);
}

export function faviconCropOutputName(
  sourceName: string,
  outputSize: FaviconCropOutputSize,
): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  if (outputSize === "native") return `${base}-cropped.png`;
  return `${base}-${outputSize}x${outputSize}.png`;
}

export function defaultSquareCropForImage(
  naturalWidth: number,
  naturalHeight: number,
): NormalizedCropRect {
  if (naturalWidth >= naturalHeight) {
    const size = naturalHeight / naturalWidth;
    return clampSquareCropRect({
      nx: (1 - size) / 2,
      ny: 0,
      nw: size,
      nh: size,
    });
  }

  const size = naturalWidth / naturalHeight;
  return clampSquareCropRect({
    nx: 0,
    ny: (1 - size) / 2,
    nw: size,
    nh: size,
  });
}

export function clampSquareCropRect(rect: NormalizedCropRect): NormalizedCropRect {
  let size = Math.min(rect.nw, rect.nh);
  size = Math.max(FAVICON_CROP_MIN_FRACTION, Math.min(1, size));

  let nx = rect.nx;
  let ny = rect.ny;

  if (nx + size > 1) nx = 1 - size;
  if (ny + size > 1) ny = 1 - size;

  nx = Math.max(0, nx);
  ny = Math.max(0, ny);

  return { nx, ny, nw: size, nh: size };
}

type SquareHandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

export function resizeSquareCropRect(
  start: NormalizedCropRect,
  handle: SquareHandleId,
  dx: number,
  dy: number,
): NormalizedCropRect {
  const startSize = start.nw;

  if (handle === "move") {
    return clampSquareCropRect({
      nx: start.nx + dx,
      ny: start.ny + dy,
      nw: startSize,
      nh: startSize,
    });
  }

  const anchorX = handle.includes("w") ? start.nx + startSize : start.nx;
  const anchorY = handle.includes("n") ? start.ny + startSize : start.ny;

  let newSize = startSize;

  if (handle === "se") newSize = startSize + Math.max(dx, dy);
  else if (handle === "nw") newSize = startSize + Math.max(-dx, -dy);
  else if (handle === "ne") newSize = startSize + Math.max(dx, -dy);
  else if (handle === "sw") newSize = startSize + Math.max(-dx, dy);
  else if (handle === "e") newSize = startSize + dx;
  else if (handle === "w") newSize = startSize - dx;
  else if (handle === "s") newSize = startSize + dy;
  else if (handle === "n") newSize = startSize - dy;

  newSize = Math.max(FAVICON_CROP_MIN_FRACTION, newSize);

  const nx = handle.includes("w") ? anchorX - newSize : anchorX;
  const ny = handle.includes("n") ? anchorY - newSize : anchorY;

  return clampSquareCropRect({ nx, ny, nw: newSize, nh: newSize });
}

export function squareCropToPixels(
  rect: NormalizedCropRect,
  naturalWidth: number,
  naturalHeight: number,
): PixelCrop {
  const safe = clampSquareCropRect(rect);
  return {
    x: safe.nx * naturalWidth,
    y: safe.ny * naturalHeight,
    width: safe.nw * naturalWidth,
    height: safe.nh * naturalHeight,
  };
}

export async function loadFaviconCropPreview(file: File): Promise<string> {
  if (isAcceptedSvgFile(file)) {
    return loadSvgPreviewUrl(file);
  }

  if (!isAcceptedFaviconPackFile(file)) {
    throw new Error("Invalid favicon source file.");
  }

  return loadImageFileForCrop(file);
}

async function resizeCroppedPngToSquare(blob: Blob, size: number): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await createImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, size, size);
    return canvasToPngBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function getCroppedFaviconBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outputSize: FaviconCropOutputSize,
): Promise<Blob> {
  const cropped = await getCroppedImageBlob(imageSrc, pixelCrop);

  if (outputSize === "native") {
    return cropped;
  }

  return resizeCroppedPngToSquare(cropped, outputSize);
}
