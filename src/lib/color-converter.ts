export type RgbColor = { r: number; g: number; b: number };
export type HslColor = { h: number; s: number; l: number };

export type ColorFormats = {
  hex: string;
  rgb: string;
  hsl: string;
  picker: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToRgb(hex: string): RgbColor | null {
  const cleaned = hex.trim().replace(/^#/, "");
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: round(h),
    s: round(s * 100),
    l: round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (hn < 60) [rn, gn, bn] = [c, x, 0];
  else if (hn < 120) [rn, gn, bn] = [x, c, 0];
  else if (hn < 180) [rn, gn, bn] = [0, c, x];
  else if (hn < 240) [rn, gn, bn] = [0, x, c];
  else if (hn < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];

  return {
    r: round((rn + m) * 255),
    g: round((gn + m) * 255),
    b: round((bn + m) * 255),
  };
}

export function formatRgb(rgb: RgbColor): string {
  return `rgb(${clamp(Math.round(rgb.r), 0, 255)}, ${clamp(Math.round(rgb.g), 0, 255)}, ${clamp(Math.round(rgb.b), 0, 255)})`;
}

export function formatHsl(hsl: HslColor): string {
  return `hsl(${round(hsl.h)}, ${round(hsl.s)}%, ${round(hsl.l)}%)`;
}

export function formatsFromRgb(rgb: RgbColor): ColorFormats {
  const hex = rgbToHex(rgb);
  return {
    hex,
    rgb: formatRgb(rgb),
    hsl: formatHsl(rgbToHsl(rgb)),
    picker: hex.toLowerCase(),
  };
}

export function parseRgbInput(value: string): RgbColor | null {
  const trimmed = value.trim();
  const match =
    /^rgba?\(\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})(?:\s*[,/]\s*[\d.]+\s*)?\)$/i.exec(
      trimmed,
    ) || /^([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})\s*[, ]\s*([0-9]{1,3})$/.exec(trimmed);

  if (!match) return null;

  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if ([r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return { r, g, b };
}

export function parseHslInput(value: string): HslColor | null {
  const trimmed = value.trim();
  const match =
    /^hsla?\(\s*([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)%?\s*[, ]\s*([+-]?\d+(?:\.\d+)?)%?(?:\s*[,/]\s*[\d.]+\s*)?\)$/i.exec(
      trimmed,
    ) ||
    /^([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)%?\s*[, ]\s*([+-]?\d+(?:\.\d+)?)%?$/.exec(
      trimmed,
    );

  if (!match) return null;

  const h = Number(match[1]);
  const s = Number(match[2]);
  const l = Number(match[3]);
  if ([h, s, l].some((n) => Number.isNaN(n))) return null;
  if (s < 0 || s > 100 || l < 0 || l > 100) return null;
  return { h: ((h % 360) + 360) % 360, s, l };
}

export type ColorInputFormat = "hex" | "rgb" | "hsl" | "picker";

export function parseColorInput(
  format: ColorInputFormat,
  value: string,
): { ok: true; rgb: RgbColor } | { ok: false } {
  if (format === "hex" || format === "picker") {
    const rgb = hexToRgb(value);
    return rgb ? { ok: true, rgb } : { ok: false };
  }

  if (format === "rgb") {
    const rgb = parseRgbInput(value);
    return rgb ? { ok: true, rgb } : { ok: false };
  }

  const hsl = parseHslInput(value);
  if (!hsl) return { ok: false };
  return { ok: true, rgb: hslToRgb(hsl) };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
