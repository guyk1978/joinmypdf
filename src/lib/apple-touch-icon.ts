import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import { canvasToPngBlob, downloadBlob } from "@/lib/generate-favicon";
import {
  joinAssetPath,
  normalizeFaviconPath,
  parseFaviconPath,
} from "@/lib/favicon-code-generator";
import { isAcceptedSvgFile, loadSvgPreviewUrl } from "@/lib/svg-to-favicon";

export { downloadBlob };

export const APPLE_TOUCH_ICON_SIZES = [
  { size: 180, filename: "apple-touch-icon.png", labelKey: "size180" },
  { size: 167, filename: "apple-touch-icon-167x167.png", labelKey: "size167" },
  { size: 152, filename: "apple-touch-icon-152x152.png", labelKey: "size152" },
] as const;

export type AppleTouchIconSize = (typeof APPLE_TOUCH_ICON_SIZES)[number]["size"];

export const DEFAULT_APPLE_TOUCH_BACKGROUND = "#ffffff";

export const DEFAULT_APPLE_TOUCH_ICON_PATH = "/apple-touch-icon.png";

/** Apple's standard iPhone home screen icon dimension. */
export const APPLE_TOUCH_ICON_RETINA_SIZE = 180;

/** Padding inset ratio — logo fits inside 80% of the square (iOS safe zone). */
export const APPLE_TOUCH_ICON_INSET_RATIO = 0.1;

/** iOS home screen icon corner radius as a fraction of icon width (~22%). */
export const IOS_HOME_SCREEN_ICON_MASK_RADIUS_RATIO = 0.22;

/** Max supersample passes when downscaling (render N× then shrink with high-quality smoothing). */
export const APPLE_TOUCH_ICON_SUPERSAMPLE_MAX = 4;

/** Recommend at least this many pixels on the shortest side for crisp 180×180 export. */
export const APPLE_TOUCH_ICON_RECOMMENDED_MIN_PX = 180;

/** Warn when the source must upscale by this factor (or more) at 180×180 export. */
export const APPLE_TOUCH_ICON_UPSCALE_WARN_FACTOR = 1.5;

export type AppleTouchIconQualityAnalysis = {
  outputSize: number;
  shortSide: number;
  upscaleFactor: number;
  needsWarning: boolean;
  recommendedMinPx: number;
  supersampleFactor: number;
  retinaReady: boolean;
};

export function isAcceptedAppleTouchImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/svg+xml"
  ) {
    return true;
  }
  return /\.(png|jpe?g|svg)$/i.test(file.name);
}

export function appleTouchIconOutputName(sourceName: string, multiple: boolean): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "apple-touch-icon";
  return multiple ? `${base}-apple-icons.zip` : "apple-touch-icon.png";
}

export function deriveAppleTouchIconAssetPath(outputFilename: string): string {
  const trimmed = outputFilename.trim();
  if (!trimmed || trimmed.endsWith(".zip")) {
    return DEFAULT_APPLE_TOUCH_ICON_PATH;
  }
  return normalizeFaviconPath(trimmed);
}

export function buildAppleTouchIconHeaderSnippet(
  primaryIconPath: string,
  selectedSizes: AppleTouchIconSize[] = [180],
): string {
  const normalized = normalizeFaviconPath(primaryIconPath);
  const { dir } = parseFaviconPath(normalized);
  const sizes = selectedSizes.length ? [...selectedSizes].sort((a, b) => b - a) : [180];
  const entries = APPLE_TOUCH_ICON_SIZES.filter((entry) => sizes.includes(entry.size));

  if (!entries.length) {
    return `<link rel="apple-touch-icon" href="${DEFAULT_APPLE_TOUCH_ICON_PATH}">`;
  }

  if (entries.length === 1) {
    const entry = entries[0];
    const href =
      entry.filename === "apple-touch-icon.png" && normalized.endsWith(".png")
        ? normalized
        : normalizeFaviconPath(joinAssetPath(dir, entry.filename));
    const sizesAttr =
      entry.size === 180 ? "" : ` sizes="${entry.size}x${entry.size}"`;
    return `<link rel="apple-touch-icon"${sizesAttr} href="${href}">`;
  }

  return entries
    .map((entry) => {
      const href = normalizeFaviconPath(joinAssetPath(dir, entry.filename));
      return `<link rel="apple-touch-icon" sizes="${entry.size}x${entry.size}" href="${href}">`;
    })
    .join("\n");
}

export function formatAppleTouchUpscaleFactor(factor: number): string {
  if (factor >= 10) return factor.toFixed(0);
  if (factor >= 2) return factor.toFixed(1);
  return factor.toFixed(2);
}

/**
 * Pick supersample factor for anti-aliased rasterization.
 * Downscales use multi-pass render-then-shrink; mild upscales use a 2× buffer.
 */
export function computeAppleTouchSupersampleFactor(
  width: number,
  height: number,
  outputSize: number,
): number {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const inset = outputSize * APPLE_TOUCH_ICON_INSET_RATIO;
  const inner = outputSize - inset * 2;
  const scale = Math.min(inner / w, inner / h);

  if (scale >= 1) {
    return scale >= 2 ? 2 : 1;
  }

  const reduction = Math.max(w, h) / inner;
  if (reduction < 1.5) return 1;
  if (reduction < 3) return 2;
  if (reduction < 6) return 3;
  return APPLE_TOUCH_ICON_SUPERSAMPLE_MAX;
}

export function analyzeAppleTouchIconSourceQuality(
  width: number,
  height: number,
  outputSize: number = APPLE_TOUCH_ICON_RETINA_SIZE,
): AppleTouchIconQualityAnalysis {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const shortSide = Math.min(w, h);
  const inset = outputSize * APPLE_TOUCH_ICON_INSET_RATIO;
  const inner = outputSize - inset * 2;
  const upscaleFactor = inner / shortSide;
  const needsWarning = upscaleFactor > APPLE_TOUCH_ICON_UPSCALE_WARN_FACTOR;
  const supersampleFactor = computeAppleTouchSupersampleFactor(w, h, outputSize);

  return {
    outputSize,
    shortSide,
    upscaleFactor,
    needsWarning,
    recommendedMinPx: APPLE_TOUCH_ICON_RECOMMENDED_MIN_PX,
    supersampleFactor,
    retinaReady: !needsWarning,
  };
}

export async function loadAppleTouchPreview(file: File): Promise<string> {
  if (!isAcceptedAppleTouchImageFile(file)) {
    throw new Error("Invalid image file.");
  }
  if (isAcceptedSvgFile(file)) {
    return loadSvgPreviewUrl(file);
  }
  return loadImageFileForCrop(file);
}

function drawAppleTouchIconDirect(
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
  const inset = size * APPLE_TOUCH_ICON_INSET_RATIO;
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

/**
 * Render an Apple Touch Icon with supersampled anti-aliasing for Retina displays.
 * Renders at up to 4× internal resolution, then downscales with high-quality smoothing.
 */
export function drawAppleTouchIcon(
  image: HTMLImageElement,
  size: number,
  backgroundColor: string | null,
): HTMLCanvasElement {
  const width = Math.max(1, image.naturalWidth || image.width);
  const height = Math.max(1, image.naturalHeight || image.height);
  const supersample = computeAppleTouchSupersampleFactor(width, height, size);

  if (supersample <= 1) {
    return drawAppleTouchIconDirect(image, size, backgroundColor);
  }

  const hiRes = size * supersample;
  const hiCanvas = drawAppleTouchIconDirect(image, hiRes, backgroundColor);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(hiCanvas, 0, 0, hiRes, hiRes, 0, 0, size, size);
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
