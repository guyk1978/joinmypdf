import { rgbToHex, type RgbColor } from "@/lib/color-converter";

export type PaletteColor = RgbColor & {
  hex: string;
  rgbLabel: string;
};

export type ExtractPaletteResult = {
  colors: PaletteColor[];
  width: number;
  height: number;
};

export const ACCEPTED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ACCEPTED_IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

/** Max canvas edge used for ColorThief analysis (keeps hi-res photos snappy). */
export const ANALYSIS_MAX_EDGE = 320;

export const DEFAULT_COLOR_COUNT = 8;
export const MIN_COLOR_COUNT = 3;
export const MAX_COLOR_COUNT = 12;

/** ColorThief quality — higher = fewer sampled pixels, faster. */
export const ANALYSIS_QUALITY = 8;

export function isAcceptedPaletteImage(file: File): boolean {
  if (ACCEPTED_IMAGE_MIME.has(file.type.toLowerCase())) return true;
  return ACCEPTED_IMAGE_EXT.test(file.name);
}

function toPaletteColor(r: number, g: number, b: number): PaletteColor {
  const color = {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
  return {
    ...color,
    hex: rgbToHex(color),
    rgbLabel: `rgb(${color.r}, ${color.g}, ${color.b})`,
  };
}

function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    image.src = objectUrl;
  });
}

/** Draw a downscaled copy for fast dominant-color analysis. */
export function drawAnalysisCanvas(
  image: HTMLImageElement,
  maxEdge = ANALYSIS_MAX_EDGE,
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function dedupeNearColors(colors: PaletteColor[], minDelta = 28): PaletteColor[] {
  const kept: PaletteColor[] = [];
  for (const color of colors) {
    const tooClose = kept.some((existing) => {
      const dr = existing.r - color.r;
      const dg = existing.g - color.g;
      const db = existing.b - color.b;
      return Math.sqrt(dr * dr + dg * dg + db * db) < minDelta;
    });
    if (!tooClose) kept.push(color);
  }
  return kept;
}

/**
 * Extract a dominant palette with ColorThief from a downscaled canvas copy.
 * Yields a frame first so the UI spinner can paint before heavy pixel work.
 */
export async function extractPaletteFromFile(
  file: File,
  colorCount = DEFAULT_COLOR_COUNT,
): Promise<ExtractPaletteResult & { objectUrl: string; image: HTMLImageElement }> {
  const count = Math.max(MIN_COLOR_COUNT, Math.min(MAX_COLOR_COUNT, Math.round(colorCount)));
  const { image, objectUrl } = await loadImageFromFile(file);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  try {
    const analysisCanvas = drawAnalysisCanvas(image);
    const { getPalette } = await import("colorthief");

    const raw =
      (await getPalette(analysisCanvas, {
        colorCount: Math.min(20, count + 2),
        quality: ANALYSIS_QUALITY,
      })) ?? [];

    const mapped = raw.map((color) => {
      const { r, g, b } = color.rgb();
      return toPaletteColor(r, g, b);
    });

    const colors = dedupeNearColors(mapped).slice(0, count);
    if (!colors.length) {
      throw new Error("No colors extracted");
    }

    return {
      colors,
      width: image.naturalWidth,
      height: image.naturalHeight,
      objectUrl,
      image,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export { copyTextToClipboard } from "@/lib/color-converter";
