import type { Metadata } from "next";

/** Paths under /icons/ (synced from assets/icons → public/icons). */
export const SITE_ICON_PATHS = {
  favicon16: "/icons/favicon-16x16.png",
  favicon32: "/icons/favicon-32x32.png",
  faviconSvg: "/icons/favicon.svg",
  faviconIco: "/icons/favicon.ico",
  appleTouch: "/icons/apple-touch-icon.png",
  android192: "/icons/android-chrome-192x192.png",
  android512: "/icons/android-chrome-512x512.png",
} as const;

export const PWA_THEME_COLOR = "#151a20";
export const PWA_BACKGROUND_COLOR = "#151a20";

/** Next.js Metadata API — equivalent to <link rel="icon"> tags in <head>. */
export const siteIconMetadata: Metadata["icons"] = {
  icon: [
    { url: SITE_ICON_PATHS.favicon16, sizes: "16x16", type: "image/png" },
    { url: SITE_ICON_PATHS.favicon32, sizes: "32x32", type: "image/png" },
    { url: SITE_ICON_PATHS.faviconSvg, type: "image/svg+xml" },
    { url: SITE_ICON_PATHS.faviconIco, sizes: "any" },
  ],
  apple: [{ url: SITE_ICON_PATHS.appleTouch, sizes: "180x180", type: "image/png" }],
  shortcut: SITE_ICON_PATHS.favicon32,
};
