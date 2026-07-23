"use client";

import { useLayoutEffect } from "react";
import { setToolIntroActive } from "@/lib/tool-intro-chrome";

/**
 * While a cinematic intro splash is showing inside the ToolModal iframe,
 * lock parent chrome so the site header cannot sit above the splash.
 * Uses layout effect so the parent hides before paint (no peek-through).
 * Clears automatically on CTA / unmount.
 */
export function useToolIntroChrome(splashActive: boolean) {
  useLayoutEffect(() => {
    if (!splashActive) return;
    setToolIntroActive(true);
    return () => setToolIntroActive(false);
  }, [splashActive]);
}
