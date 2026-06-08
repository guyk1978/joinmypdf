"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Syncs <html lang/dir> with the active next-intl locale (root layout owns the html element). */
export function DocumentLocaleAttributes() {
  const locale = useLocale();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === "he" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
