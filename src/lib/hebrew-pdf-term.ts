import { BRAND_NAME_EN, BRAND_NAME_HE } from "./brand";

/** Hebrew spelling of “PDF” for user-facing copy on Hebrew pages. */
export const HEBREW_PDF_TERM = "פי די אף";

/** Standalone “PDF” only — skips JoinMyPDF and other letter-adjacent tokens. */
const STANDALONE_PDF = /(?<![A-Za-z])PDF(?![A-Za-z])/g;

/** Replace Latin “PDF” with פי די אף while keeping the JoinMyPDF brand intact. */
export function localizeHebrewPdfInText(text: string): string {
  if (!text.includes("PDF")) return text;
  return text.replace(STANDALONE_PDF, HEBREW_PDF_TERM);
}

/** Replace JoinMyPDF with the Hebrew brand name. */
export function localizeHebrewBrandInText(text: string): string {
  if (!text.includes(BRAND_NAME_EN)) return text;
  return text.replaceAll(BRAND_NAME_EN, BRAND_NAME_HE);
}

/** Full Hebrew copy pass — brand name, then PDF term. */
export function localizeHebrewCopyInText(text: string): string {
  return localizeHebrewPdfInText(localizeHebrewBrandInText(text));
}

/** Recursively localize Hebrew user-facing copy in nested payloads. */
export function localizeHebrewPdfDeep<T>(value: T): T {
  if (typeof value === "string") {
    return localizeHebrewCopyInText(value) as T;
  }  if (Array.isArray(value)) {
    return value.map((item) => localizeHebrewPdfDeep(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = localizeHebrewPdfDeep(entry);
    }
    return out as T;
  }
  return value;
}
