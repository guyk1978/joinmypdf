import { createImage } from "@/lib/crop-image";
import { contrastRatio, FAVICON_WCAG_AA_RATIO } from "@/lib/favicon-brand-harmony";
import { drawSvgToSquareCanvas } from "@/lib/svg-to-favicon";

/** Typical browser tab chrome backgrounds (light / dark themes). */
export const BROWSER_TAB_BACKGROUNDS = {
  light: "#ffffff",
  dark: "#292a2d",
} as const;

const ALPHA_THRESHOLD = 128;
const TRANSPARENT_DOMINANCE = 0.2;

export type SvgFaviconContrastLimitingContext =
  | "light-tab"
  | "dark-tab"
  | "internal"
  | null;

export type SvgFaviconContrastResult = {
  valid: boolean;
  foregroundHex: string | null;
  iconBackgroundHex: string | null;
  lightTabRatio: number;
  darkTabRatio: number;
  internalRatio: number | null;
  worstRatio: number;
  passes: boolean;
  limitingContext: SvgFaviconContrastLimitingContext;
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function quantizeChannel(value: number): number {
  return Math.round(value / 16) * 16;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function analyzeFaviconImageData(imageData: ImageData): SvgFaviconContrastResult {
  const invalid: SvgFaviconContrastResult = {
    valid: false,
    foregroundHex: null,
    iconBackgroundHex: null,
    lightTabRatio: 0,
    darkTabRatio: 0,
    internalRatio: null,
    worstRatio: 0,
    passes: false,
    limitingContext: null,
  };

  const totalPixels = imageData.width * imageData.height;
  if (!totalPixels) return invalid;

  const buckets = new Map<string, number>();
  let transparentCount = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3];
    if (alpha < ALPHA_THRESHOLD) {
      transparentCount += 1;
      continue;
    }

    const hex = rgbToHex(
      quantizeChannel(imageData.data[index]),
      quantizeChannel(imageData.data[index + 1]),
      quantizeChannel(imageData.data[index + 2]),
    );
    buckets.set(hex, (buckets.get(hex) ?? 0) + 1);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return invalid;

  const transparentRatio = transparentCount / totalPixels;
  const hasTransparentBackground = transparentRatio >= TRANSPARENT_DOMINANCE;

  const iconBackgroundHex = hasTransparentBackground ? null : sorted[0][0];
  const foregroundHex = hasTransparentBackground
    ? sorted[0][0]
    : (sorted[1]?.[0] ?? sorted[0][0]);

  const lightTabRatio = contrastRatio(foregroundHex, BROWSER_TAB_BACKGROUNDS.light);
  const darkTabRatio = contrastRatio(foregroundHex, BROWSER_TAB_BACKGROUNDS.dark);
  const internalRatio =
    iconBackgroundHex && iconBackgroundHex !== foregroundHex
      ? contrastRatio(foregroundHex, iconBackgroundHex)
      : null;

  const checks: { context: SvgFaviconContrastLimitingContext; ratio: number }[] = [
    { context: "light-tab", ratio: lightTabRatio },
    { context: "dark-tab", ratio: darkTabRatio },
  ];
  if (internalRatio !== null) {
    checks.push({ context: "internal", ratio: internalRatio });
  }

  const worst = checks.reduce((current, entry) => (entry.ratio < current.ratio ? entry : current));

  return {
    valid: true,
    foregroundHex,
    iconBackgroundHex,
    lightTabRatio,
    darkTabRatio,
    internalRatio,
    worstRatio: worst.ratio,
    passes: worst.ratio >= FAVICON_WCAG_AA_RATIO,
    limitingContext: worst.context,
  };
}

/** Rasterize SVG at 16×16 and measure contrast against typical browser tab backgrounds. */
export async function analyzeSvgFaviconContrast(imageSrc: string): Promise<SvgFaviconContrastResult> {
  const image = await createImage(imageSrc);
  const canvas = drawSvgToSquareCanvas(image, 16);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      valid: false,
      foregroundHex: null,
      iconBackgroundHex: null,
      lightTabRatio: 0,
      darkTabRatio: 0,
      internalRatio: null,
      worstRatio: 0,
      passes: false,
      limitingContext: null,
    };
  }

  return analyzeFaviconImageData(ctx.getImageData(0, 0, 16, 16));
}

export function formatContrastRatio(ratio: number): string {
  return ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2);
}
