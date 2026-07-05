import { createImage } from "@/lib/crop-image";
import { normalizeFaviconPath } from "@/lib/favicon-code-generator";
import { encodeIcoBlob, downloadBlob } from "@/lib/generate-favicon";

export { downloadBlob };

/** Standard favicon raster sizes — browser tabs, taskbars, desktop shortcuts. */
export const SVG_SMART_ICON_SIZES = [16, 32, 64, 128] as const;

export type SvgSmartIconSize = (typeof SVG_SMART_ICON_SIZES)[number];

const SVG_MIME = "image/svg+xml";

/** @deprecated Use SVG_SMART_ICON_SIZES — kept for backward compatibility. */
export const SVG_FAVICON_SIZE_OPTIONS = [32, 48, 64] as const;

/** @deprecated Use SvgSmartIconSize */
export type SvgFaviconOutputSize = (typeof SVG_FAVICON_SIZE_OPTIONS)[number];

export function isAcceptedSvgFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === SVG_MIME) return true;
  return /\.svg$/i.test(file.name);
}

export function svgToFaviconOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  return `${base}.ico`;
}

export function deriveSvgToFaviconAssetPath(outputFilename: string): string {
  const trimmed = outputFilename.trim() || "favicon.ico";
  if (trimmed.includes("/")) {
    return normalizeFaviconPath(trimmed);
  }
  const name = trimmed.endsWith(".ico") ? trimmed : `${trimmed.replace(/\.[^.]+$/, "") || "favicon"}.ico`;
  return normalizeFaviconPath(name);
}

export function buildSvgToFaviconHeaderSnippet(iconPath: string): string {
  const href = normalizeFaviconPath(iconPath);
  return `<link rel="icon" href="${href}" type="image/x-icon">`;
}

export type SvgComplexityHints = {
  pathCount: number;
  hasText: boolean;
  hasGradients: boolean;
  hasFilters: boolean;
  viewBoxMax: number;
};

function parseViewBoxMax(svgText: string): number {
  const match = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (!match) return 0;
  const parts = match[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (parts.length < 4) return 0;
  return Math.max(parts[2], parts[3]);
}

/** Inspect SVG markup to estimate visual complexity for smart size selection. */
export function analyzeSvgComplexity(svgText: string): SvgComplexityHints {
  const normalized = svgText.toLowerCase();
  const pathCount =
    (normalized.match(/<path[\s>]/g)?.length ?? 0) +
    (normalized.match(/<circle[\s>]/g)?.length ?? 0) +
    (normalized.match(/<rect[\s>]/g)?.length ?? 0) +
    (normalized.match(/<polygon[\s>]/g)?.length ?? 0) +
    (normalized.match(/<polyline[\s>]/g)?.length ?? 0) +
    (normalized.match(/<ellipse[\s>]/g)?.length ?? 0);

  return {
    pathCount,
    hasText: /<text[\s>]/i.test(svgText),
    hasGradients: /<(?:linear|radial)gradient[\s>]/i.test(svgText),
    hasFilters: /<filter[\s>]/i.test(svgText),
    viewBoxMax: parseViewBoxMax(svgText),
  };
}

/**
 * Pick the most effective ICO frame sizes for an SVG source.
 * Always includes 16/32/64 for tabs and taskbars; adds 128 for detailed or large artwork.
 */
export function detectSmartIconSizes(
  svgText: string,
  naturalSize?: { width: number; height: number } | null,
): SvgSmartIconSize[] {
  const hints = analyzeSvgComplexity(svgText);
  const maxDim = naturalSize
    ? Math.max(naturalSize.width, naturalSize.height)
    : hints.viewBoxMax;

  const isDetailed =
    hints.pathCount > 8 ||
    hints.hasText ||
    hints.hasGradients ||
    hints.hasFilters ||
    maxDim >= 96;

  if (isDetailed) {
    return [...SVG_SMART_ICON_SIZES];
  }

  return [16, 32, 64];
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

export async function readSvgFileText(file: File): Promise<string> {
  if (!isAcceptedSvgFile(file)) {
    throw new Error("Invalid SVG file.");
  }
  const text = await file.text();
  if (!text.trim() || !/<svg[\s>]/i.test(text)) {
    throw new Error("Invalid SVG file.");
  }
  return text;
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
  sizes: number[],
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const frames = sizes.map((size) => ({
    size,
    canvas: drawSvgToSquareCanvas(image, size),
  }));
  return encodeIcoBlob(frames);
}

/** @deprecated Use convertSvgImageToIco with detectSmartIconSizes */
export function icoSizesForSelection(selectedSize: SvgFaviconOutputSize): number[] {
  const sizes = [16, 32, 48, 64];
  return sizes.filter((size) => size <= selectedSize);
}
