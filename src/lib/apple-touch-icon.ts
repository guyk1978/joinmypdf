import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import { canvasToPngBlob, downloadBlob } from "@/lib/generate-favicon";

export { downloadBlob };

export const APPLE_TOUCH_ICON_SIZES = [
  { size: 180, filename: "apple-touch-icon.png", labelKey: "size180" },
  { size: 167, filename: "apple-touch-icon-167x167.png", labelKey: "size167" },
  { size: 152, filename: "apple-touch-icon-152x152.png", labelKey: "size152" },
] as const;

export type AppleTouchIconSize = (typeof APPLE_TOUCH_ICON_SIZES)[number]["size"];

export const DEFAULT_APPLE_TOUCH_BACKGROUND = "#ffffff";

export function isAcceptedAppleTouchImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/png" || type === "image/jpeg" || type === "image/jpg") return true;
  return /\.(png|jpe?g)$/i.test(file.name);
}

export function appleTouchIconOutputName(sourceName: string, multiple: boolean): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "apple-touch-icon";
  return multiple ? `${base}-apple-icons.zip` : "apple-touch-icon.png";
}

export async function loadAppleTouchPreview(file: File): Promise<string> {
  if (!isAcceptedAppleTouchImageFile(file)) {
    throw new Error("Invalid image file.");
  }
  return loadImageFileForCrop(file);
}

export function drawAppleTouchIcon(
  image: HTMLImageElement,
  size: number,
  backgroundColor: string | null,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }

  const width = Math.max(1, image.naturalWidth || image.width);
  const height = Math.max(1, image.naturalHeight || image.height);
  const inset = size * 0.1;
  const inner = size - inset * 2;
  const scale = Math.min(inner / width, inner / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  return canvas;
}

export async function renderAppleTouchPreviewUrl(
  imageSrc: string,
  size: number,
  backgroundColor: string | null,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = drawAppleTouchIcon(image, size, backgroundColor);
  const blob = await canvasToPngBlob(canvas);
  return URL.createObjectURL(blob);
}

export async function exportAppleTouchIcons(
  imageSrc: string,
  selectedSizes: AppleTouchIconSize[],
  backgroundColor: string | null,
): Promise<{ blob: Blob; multiple: boolean }> {
  const image = await createImage(imageSrc);
  const entries = APPLE_TOUCH_ICON_SIZES.filter((entry) => selectedSizes.includes(entry.size));

  if (!entries.length) {
    throw new Error("No icon sizes selected.");
  }

  if (entries.length === 1) {
    const canvas = drawAppleTouchIcon(image, entries[0].size, backgroundColor);
    return { blob: await canvasToPngBlob(canvas), multiple: false };
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const entry of entries) {
    const canvas = drawAppleTouchIcon(image, entry.size, backgroundColor);
    const pngBlob = await canvasToPngBlob(canvas);
    zip.file(entry.filename, await pngBlob.arrayBuffer());
  }

  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  return { blob: zipBlob, multiple: true };
}
