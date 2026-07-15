/** Storage / data size conversion — SI (1000) and IEC (1024) units. */

export type StorageScale = "si" | "iec";

export type StorageUnitId =
  | "B"
  | "KB"
  | "MB"
  | "GB"
  | "TB"
  | "PB"
  | "KiB"
  | "MiB"
  | "GiB"
  | "TiB"
  | "PiB";

export type StorageUnitDef = {
  id: StorageUnitId;
  labelKey: StorageUnitId;
  scale: StorageScale | "byte";
  /** Power of the scale base (0 for bytes). */
  exponent: number;
};

/** Bytes first, then SI (decimal) and IEC (binary) units. */
export const STORAGE_UNITS: readonly StorageUnitDef[] = [
  { id: "B", labelKey: "B", scale: "byte", exponent: 0 },
  { id: "KB", labelKey: "KB", scale: "si", exponent: 1 },
  { id: "MB", labelKey: "MB", scale: "si", exponent: 2 },
  { id: "GB", labelKey: "GB", scale: "si", exponent: 3 },
  { id: "TB", labelKey: "TB", scale: "si", exponent: 4 },
  { id: "PB", labelKey: "PB", scale: "si", exponent: 5 },
  { id: "KiB", labelKey: "KiB", scale: "iec", exponent: 1 },
  { id: "MiB", labelKey: "MiB", scale: "iec", exponent: 2 },
  { id: "GiB", labelKey: "GiB", scale: "iec", exponent: 3 },
  { id: "TiB", labelKey: "TiB", scale: "iec", exponent: 4 },
  { id: "PiB", labelKey: "PiB", scale: "iec", exponent: 5 },
] as const;

const SI_BASE = 1000n;
const IEC_BASE = 1024n;

export function findStorageUnit(id: string): StorageUnitDef | undefined {
  return STORAGE_UNITS.find((unit) => unit.id === id);
}

export function bytesFactor(unit: StorageUnitDef): bigint {
  if (unit.scale === "byte" || unit.exponent === 0) return 1n;
  const base = unit.scale === "si" ? SI_BASE : IEC_BASE;
  let factor = 1n;
  for (let i = 0; i < unit.exponent; i += 1) factor *= base;
  return factor;
}

/** Parse a non-negative decimal input (optional fraction). */
export function parseStorageInput(raw: string): { ok: true; value: number } | { ok: false; error: "empty" | "invalid" } {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return { ok: false, error: "empty" };
  if (!/^\+?\d*\.?\d+(?:[eE][+-]?\d+)?$/.test(trimmed) && !/^\+?\d+\.?$/.test(trimmed)) {
    return { ok: false, error: "invalid" };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return { ok: false, error: "invalid" };
  return { ok: true, value };
}

/**
 * Convert using integer byte math via scaled BigInt to reduce float drift for whole numbers.
 * Fractional inputs fall back to Number with high-precision formatting.
 */
export function convertStorage(
  raw: string,
  fromId: StorageUnitId,
  toId: StorageUnitId,
):
  | { ok: true; output: string; bytes: number }
  | { ok: false; error: "empty" | "invalid" | "unknown-unit" } {
  const parsed = parseStorageInput(raw);
  if (!parsed.ok) return parsed;

  const from = findStorageUnit(fromId);
  const to = findStorageUnit(toId);
  if (!from || !to) return { ok: false, error: "unknown-unit" };

  const fromFactor = Number(bytesFactor(from));
  const toFactor = Number(bytesFactor(to));
  const bytes = parsed.value * fromFactor;
  const result = bytes / toFactor;

  if (!Number.isFinite(result)) return { ok: false, error: "invalid" };

  return {
    ok: true,
    output: formatStorageNumber(result),
    bytes,
  };
}

export function formatStorageNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "0";

  // Prefer readable fixed decimals for small fractions; scientific for huge magnitudes.
  if (Math.abs(value) >= 1e15 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }

  const fixed = value.toFixed(12).replace(/\.?0+$/, "");
  // Keep up to 12 meaningful fractional digits without trailing zeros.
  if (!fixed.includes(".")) return fixed;

  const [intPart, frac = ""] = fixed.split(".");
  const trimmedFrac = frac.replace(/0+$/, "").slice(0, 12);
  return trimmedFrac ? `${intPart}.${trimmedFrac}` : intPart;
}

export const DEFAULT_FROM_UNIT: StorageUnitId = "GB";
export const DEFAULT_TO_UNIT: StorageUnitId = "MB";
