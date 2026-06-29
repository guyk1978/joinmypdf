export type PdfCompressionPreset = "high" | "medium" | "max";

export const PDF_COMPRESSION_PRESET_ORDER: PdfCompressionPreset[] = ["high", "medium", "max"];

export const PDF_COMPRESSION_PRESETS: Record<
  PdfCompressionPreset,
  { jpegQuality: number; renderScale: number }
> = {
  /** High quality — larger output, minimal visual loss */
  high: { jpegQuality: 0.88, renderScale: 2 },
  /** Balanced size and readability */
  medium: { jpegQuality: 0.72, renderScale: 1.5 },
  /** Smallest file — stronger raster compression */
  max: { jpegQuality: 0.52, renderScale: 1.15 },
};

export const DEFAULT_PDF_COMPRESSION_PRESET: PdfCompressionPreset = "medium";

/** Restore saved project settings from legacy numeric slider values. */
export function normalizeCompressionPreset(
  value: unknown,
): PdfCompressionPreset {
  if (value === "high" || value === "medium" || value === "max") return value;
  if (typeof value === "number") {
    if (value >= 85) return "high";
    if (value >= 70) return "medium";
    return "max";
  }
  return DEFAULT_PDF_COMPRESSION_PRESET;
}
