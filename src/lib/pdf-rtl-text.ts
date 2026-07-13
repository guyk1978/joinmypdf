import bidiFactory from "bidi-js";

const bidi = bidiFactory();

/** True if the string contains Hebrew letters. */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Convert logical Unicode text to visual order for LTR painters (pdf-lib drawText).
 * Uses the Unicode Bidirectional Algorithm (bidi-js) including mirrored punctuation.
 */
export function logicalToVisual(text: string, baseDir: "ltr" | "rtl" = "rtl"): string {
  if (!text) return text;

  const embeddingLevels = bidi.getEmbeddingLevels(text, baseDir);
  const chars = Array.from(text);

  // Mirror paired punctuation (e.g. "(" ↔ ")") for RTL runs.
  const mirrored = bidi.getMirroredCharactersMap(text, embeddingLevels);
  mirrored.forEach((replacement, index) => {
    if (index >= 0 && index < chars.length) {
      chars[index] = replacement;
    }
  });

  // Apply required segment reversals in order.
  const flips = bidi.getReorderSegments(text, embeddingLevels);
  for (const range of flips) {
    const start = range[0];
    const end = range[1];
    if (start == null || end == null || end < start) continue;
    const slice = chars.slice(start, end + 1).reverse();
    chars.splice(start, end - start + 1, ...slice);
  }

  return chars.join("");
}

/**
 * Prepare a single wrapped line for pdf-lib drawText.
 * Hebrew / RTL lines are converted to visual order and flagged for right alignment.
 */
export function prepareRtlLineForPdf(text: string): { text: string; rtl: boolean } {
  if (!containsHebrew(text)) {
    return { text, rtl: false };
  }
  return {
    text: logicalToVisual(text, "rtl"),
    rtl: true,
  };
}
