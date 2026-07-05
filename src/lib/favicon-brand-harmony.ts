export type FaviconColorPalette = {
  backgroundColor: string;
  textColor: string;
};

const WCAG_AA_RATIO = 4.5;
export const FAVICON_WCAG_AA_RATIO = WCAG_AA_RATIO;
const MATTE_MAX_SATURATION = 0.42;
const LIGHT_TEXT = "#f0f1f3";
const DARK_TEXT = "#1a1c21";
const WARM_WHITE = "#e8eaed";
const INDUSTRIAL_CHARCOAL = "#1a1c21";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const full =
    cleaned.length === 3 ? cleaned.split("").map((char) => char + char).join("") : cleaned;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      default:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let channel = t;
    if (channel < 0) channel += 1;
    if (channel > 1) channel -= 1;
    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

function toMatteHex(h: number, s: number, l: number): string {
  const matteS = Math.min(s, MATTE_MAX_SATURATION);
  const { r, g, b } = hslToRgb(h, matteS, clamp(l, 0, 1));
  return rgbToHex(r, g, b);
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fg = parseHexColor(foregroundHex);
  const bg = parseHexColor(backgroundHex);
  if (!fg || !bg) return 1;

  const fgLum = relativeLuminance(fg.r, fg.g, fg.b);
  const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickAccessibleText(backgroundHex: string): string {
  const candidates = [LIGHT_TEXT, WARM_WHITE, "#ffffff", DARK_TEXT, "#2d3038", "#4a4f57"];
  for (const candidate of candidates) {
    if (contrastRatio(candidate, backgroundHex) >= WCAG_AA_RATIO) return candidate;
  }

  const bg = parseHexColor(backgroundHex);
  if (!bg) return LIGHT_TEXT;
  return relativeLuminance(bg.r, bg.g, bg.b) > 0.5 ? DARK_TEXT : LIGHT_TEXT;
}

function ensureContrast(backgroundHex: string, textHex: string): string {
  if (contrastRatio(textHex, backgroundHex) >= WCAG_AA_RATIO) return textHex;
  return pickAccessibleText(backgroundHex);
}

/** Client-side Industrial Matte palettes from a primary brand color (WCAG AA). */
export function buildBrandHarmonyPalettes(brandHex: string): FaviconColorPalette[] {
  const rgb = parseHexColor(brandHex);
  if (!rgb) return [];

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const matteS = Math.min(s, MATTE_MAX_SATURATION);

  const deepBrandBg = toMatteHex(h, matteS, clamp(l * 0.35, 0.16, 0.26));
  const lightBrandBg = toMatteHex(h, matteS * 0.35, 0.88);
  const darkBrandText = toMatteHex(h, matteS, clamp(l * 0.5, 0.18, 0.32));
  const accentText = toMatteHex(h, matteS, clamp(l + 0.22, 0.55, 0.75));
  const compHue = (h + 28) % 360;
  const compBg = toMatteHex(compHue, matteS * 0.65, 0.22);

  const raw: FaviconColorPalette[] = [
    {
      backgroundColor: deepBrandBg,
      textColor: ensureContrast(deepBrandBg, accentText),
    },
    {
      backgroundColor: INDUSTRIAL_CHARCOAL,
      textColor: ensureContrast(INDUSTRIAL_CHARCOAL, accentText),
    },
    {
      backgroundColor: lightBrandBg,
      textColor: ensureContrast(lightBrandBg, darkBrandText),
    },
    {
      backgroundColor: compBg,
      textColor: ensureContrast(compBg, toMatteHex(h, matteS, 0.78)),
    },
  ];

  const seen = new Set<string>();
  return raw.filter((palette) => {
    if (contrastRatio(palette.textColor, palette.backgroundColor) < WCAG_AA_RATIO) {
      return false;
    }
    const key = `${palette.backgroundColor}-${palette.textColor}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
