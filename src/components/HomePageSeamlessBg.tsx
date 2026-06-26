"use client";

import { getHomePageThemeVars } from "@/lib/home-hero-bg";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_VAR_KEYS = [
  "--home-page-bg",
  "--home-card-bg",
  "--home-card-bg-hover",
  "--home-card-text",
  "--home-icon-bg",
  "--home-icon-bg-hover",
  "--home-card-muted",
  "--home-card-border",
  "--home-card-border-hover",
] as const;

/** Applies sampled header-banner theme tokens to the homepage for a seamless hero → grid blend. */
export function HomePageSeamlessBg() {
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const isLight = (resolvedTheme ?? "light") !== "dark";
  useEffect(() => {
    const vars = getHomePageThemeVars(locale, isLight);
    const root = document.documentElement;
    for (const key of THEME_VAR_KEYS) {
      root.style.setProperty(key, vars[key]);
    }
    return () => {
      for (const key of THEME_VAR_KEYS) {
        root.style.removeProperty(key);
      }
    };
  }, [locale, isLight]);

  return null;
}
