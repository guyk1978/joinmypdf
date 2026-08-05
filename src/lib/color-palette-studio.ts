import {
  formatsFromRgb,
  hslToRgb,
  rgbToHsl,
  rgbToHex,
  type HslColor,
  type RgbColor,
} from "@/lib/color-converter";

export type HarmonyMode =
  | "analogous"
  | "complementary"
  | "triadic"
  | "splitComplementary"
  | "tetradic"
  | "monochromatic";

export type PaletteSwatch = {
  id: string;
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  locked: boolean;
};

export type ContrastLevel = "fail" | "AA-large" | "AA" | "AAA";

export type ContrastResult = {
  ratio: number;
  level: ContrastLevel;
  passesAaNormal: boolean;
  passesAaLarge: boolean;
  passesAaaNormal: boolean;
  passesAaaLarge: boolean;
};

export const HARMONY_MODES: readonly HarmonyMode[] = [
  "analogous",
  "complementary",
  "triadic",
  "splitComplementary",
  "tetradic",
  "monochromatic",
] as const;

export const PALETTE_SIZE = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function swatchFromHsl(hsl: HslColor, locked = false): PaletteSwatch {
  const rgb = hslToRgb(hsl);
  return {
    id: rgbToHex(rgb),
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    locked,
  };
}

function swatchFromRgb(rgb: RgbColor, locked = false): PaletteSwatch {
  const hsl = rgbToHsl(rgb);
  const hex = rgbToHex(rgb);
  return { id: hex, hex, rgb, hsl, locked };
}

function hueOffsets(mode: HarmonyMode, baseHue: number): number[] {
  switch (mode) {
    case "complementary":
      return [0, 30, 180, 210, 150];
    case "triadic":
      return [0, 120, 240, 60, 180];
    case "splitComplementary":
      return [0, 150, 210, 30, 180];
    case "tetradic":
      return [0, 90, 180, 270, 45];
    case "analogous":
      return [0, -30, 30, -60, 60];
    case "monochromatic":
    default:
      return [0, 0, 0, 0, 0];
  }
}

function lightnessSteps(mode: HarmonyMode): number[] {
  if (mode === "monochromatic") return [22, 38, 52, 68, 82];
  return [42, 52, 58, 46, 64];
}

function saturationSteps(mode: HarmonyMode, baseS: number): number[] {
  if (mode === "monochromatic") {
    return [
      clamp(baseS * 0.55, 12, 90),
      clamp(baseS * 0.75, 16, 95),
      clamp(baseS, 20, 100),
      clamp(baseS * 0.85, 18, 95),
      clamp(baseS * 0.65, 14, 90),
    ];
  }
  return [
    clamp(baseS, 25, 95),
    clamp(baseS * 0.9, 22, 95),
    clamp(baseS * 1.05, 28, 100),
    clamp(baseS * 0.8, 20, 90),
    clamp(baseS * 0.95, 24, 95),
  ];
}

/** Build a fresh 5-color harmony from a base HSL seed. */
export function generateHarmonyPalette(
  mode: HarmonyMode,
  seed?: Partial<HslColor>,
): PaletteSwatch[] {
  const base: HslColor = {
    h: seed?.h ?? randomBetween(0, 360),
    s: seed?.s ?? randomBetween(45, 85),
    l: seed?.l ?? randomBetween(40, 60),
  };
  const offsets = hueOffsets(mode, base.h);
  const lights = lightnessSteps(mode);
  const sats = saturationSteps(mode, base.s);

  return offsets.map((offset, index) =>
    swatchFromHsl({
      h: wrapHue(base.h + offset),
      s: sats[index] ?? base.s,
      l: lights[index] ?? base.l,
    }),
  );
}

/**
 * Regenerate unlocked swatches while keeping locked colors in place.
 * Uses the first unlocked (or first) swatch as the harmony seed when possible.
 */
export function regeneratePalette(
  current: readonly PaletteSwatch[],
  mode: HarmonyMode,
): PaletteSwatch[] {
  const seedSource = current.find((swatch) => !swatch.locked) ?? current[0];
  const next = generateHarmonyPalette(mode, seedSource?.hsl);
  return next.map((swatch, index) => {
    const previous = current[index];
    if (previous?.locked) {
      return { ...previous, locked: true };
    }
    return { ...swatch, locked: false };
  });
}

export function createDefaultPalette(mode: HarmonyMode = "analogous"): PaletteSwatch[] {
  return generateHarmonyPalette(mode, { h: 217, s: 91, l: 53 });
}

export function toggleSwatchLock(
  palette: readonly PaletteSwatch[],
  index: number,
): PaletteSwatch[] {
  return palette.map((swatch, i) =>
    i === index ? { ...swatch, locked: !swatch.locked } : swatch,
  );
}

export function updateSwatchColor(
  palette: readonly PaletteSwatch[],
  index: number,
  rgb: RgbColor,
): PaletteSwatch[] {
  return palette.map((swatch, i) => {
    if (i !== index) return swatch;
    return { ...swatchFromRgb(rgb), locked: swatch.locked };
  });
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance(rgb: RgbColor): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

export function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateContrast(foreground: RgbColor, background: RgbColor): ContrastResult {
  const ratio = Math.round(contrastRatio(foreground, background) * 100) / 100;
  const passesAaaNormal = ratio >= 7;
  const passesAaNormal = ratio >= 4.5;
  const passesAaaLarge = ratio >= 4.5;
  const passesAaLarge = ratio >= 3;

  let level: ContrastLevel = "fail";
  if (passesAaaNormal) level = "AAA";
  else if (passesAaNormal) level = "AA";
  else if (passesAaLarge) level = "AA-large";

  return {
    ratio,
    level,
    passesAaNormal,
    passesAaLarge,
    passesAaaNormal,
    passesAaaLarge,
  };
}

export function paletteToCssVariables(palette: readonly PaletteSwatch[]): string {
  return palette
    .map((swatch, index) => `  --color-${index + 1}: ${swatch.hex};`)
    .join("\n");
}

export function paletteToJson(palette: readonly PaletteSwatch[]): string {
  return JSON.stringify(
    palette.map((swatch) => ({
      hex: swatch.hex,
      rgb: formatsFromRgb(swatch.rgb).rgb,
      hsl: formatsFromRgb(swatch.rgb).hsl,
    })),
    null,
    2,
  );
}

export function downloadTextFile(filename: string, contents: string, mime = "text/plain"): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { formatsFromRgb, swatchFromRgb };
