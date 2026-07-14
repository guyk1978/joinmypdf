/**
 * Local Text Sanitizer engine for pasted PDF-extracted text, OCR, and drafts.
 * Client-side only; no uploads.
 */

export type SanitizeOptions = {
  fixLineBreaks: boolean;
  removeExtraSpaces: boolean;
  cleanInvisibleChars: boolean;
  fixHebrewPunctuation: boolean;
};

export const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  fixLineBreaks: true,
  removeExtraSpaces: true,
  cleanInvisibleChars: true,
  fixHebrewPunctuation: true,
};

const SENTENCE_END = /[.!?…׃؟]"?['']?\s*$/u;
const HEBREW_CHAR = /[\u0590-\u05FF]/u;

/**
 * Join soft-wrapped lines that do not end with sentence punctuation.
 * Blank lines are preserved as paragraph breaks.
 */
export function fixLineBreaks(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  let buffer = "";

  for (const raw of lines) {
    const trimmedEnd = raw.replace(/[ \t]+$/g, "");
    const isBlank = trimmedEnd.trim().length === 0;

    if (isBlank) {
      if (buffer) {
        out.push(buffer);
        buffer = "";
      }
      out.push("");
      continue;
    }

    const line = trimmedEnd.replace(/^[ \t]+/g, "");
    if (!buffer) {
      buffer = line;
      continue;
    }

    if (SENTENCE_END.test(buffer)) {
      out.push(buffer);
      buffer = line;
    } else {
      buffer = `${buffer.replace(/\s+$/g, "")} ${line}`;
    }
  }

  if (buffer) out.push(buffer);
  return out.join("\n");
}

/** Normalize tabs, double spaces, and per-line leading/trailing whitespace. */
export function removeExtraSpaces(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").replace(/^[ \t]+|[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Strip non-printable / invisible characters that break rendering
 * (ZWSP, BOM, soft hyphen, C0/C1 controls) while preserving newlines and tabs.
 */
export function cleanInvisibleChars(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}

/**
 * Fix Hebrew LTR/RTL punctuation drift: move sentence-ending marks that
 * landed at the start of a Hebrew line/string to the logical end.
 */
export function fixHebrewPunctuation(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => {
      if (!HEBREW_CHAR.test(line)) return line;

      let next = line;

      // ".זה משפט" / "؟שלום" -> "זה משפט." / "שלום؟"
      const leading = next.match(/^([.!؟?…׃]+)(\s*)(.+)$/u);
      if (leading && HEBREW_CHAR.test(leading[3])) {
        const body = leading[3].replace(/\s+$/u, "");
        next = `${body}${leading[1]}`;
      }

      // "מילה ." -> "מילה."
      next = next.replace(/([\u0590-\u05FF])\s+([.!؟?…׃]+)\s*$/u, "$1$2");

      // Isolated punct between Hebrew words: "מילה . מילה" -> "מילה. מילה"
      next = next.replace(/([\u0590-\u05FF])\s+([.!؟?…׃]+)\s+(?=[\u0590-\u05FF])/gu, "$1$2 ");

      return next;
    })
    .join("\n");
}

export function sanitizeText(input: string, options: SanitizeOptions): string {
  let result = input;
  if (options.cleanInvisibleChars) result = cleanInvisibleChars(result);
  // Hebrew punct before line joins so leading marks become sentence endings first.
  if (options.fixHebrewPunctuation) result = fixHebrewPunctuation(result);
  if (options.fixLineBreaks) result = fixLineBreaks(result);
  if (options.removeExtraSpaces) result = removeExtraSpaces(result);
  return result;
}
