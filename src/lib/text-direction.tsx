import type { ReactNode } from "react";

/** Matches sizes like `4 GB`, `256GB`, `1.5 MB`, `12,000 KB`. */
const LTR_UNIT_CHUNK = /^\d[\d,.]*\s*(?:TB|GB|MB|KB|PB)$/i;
const LTR_UNIT_SPLIT = /(\d[\d,.]*\s*(?:TB|GB|MB|KB|PB|tb|gb|mb|kb|pb)\b)/g;

/**
 * Wrap number+unit runs in an LTR isolate so Hebrew (RTL) copy keeps
 * "4 GB" / "256 GB" readable without flipped punctuation or broken flow.
 */
export function renderTextWithLtrUnits(text: string): ReactNode {
  const parts = text.split(LTR_UNIT_SPLIT);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (!part) return null;
    if (LTR_UNIT_CHUNK.test(part)) {
      return (
        <span key={index} dir="ltr" className="u-ltr-isolate">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function formatCompactRatingCount(count: number): string {
  if (count >= 10000) return Math.round(count / 1000).toString();
  return (count / 1000).toFixed(1).replace(/\.0$/, "");
}
