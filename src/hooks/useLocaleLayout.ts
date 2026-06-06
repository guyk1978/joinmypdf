"use client";

import { useLocale } from "next-intl";

/** Locale-aware layout helpers for RTL (Hebrew) vs LTR (English). */
export function useLocaleLayout() {
  const locale = useLocale();
  const isRtl = locale === "he";

  return {
    locale,
    isRtl,
    dir: isRtl ? ("rtl" as const) : ("ltr" as const),
    /** Inline arrow for “continue” / link affordances */
    arrow: isRtl ? "←" : "→",
    /** Prefer Tailwind logical utilities (`text-start`, `ms-`, `me-`) when possible */
    textStart: "text-start",
    textEnd: "text-end",
  };
}
