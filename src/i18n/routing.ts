import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "he"],
  defaultLocale: "en",
  localePrefix: "always",
  // Static export builds cannot negotiate locale on the server (no middleware).
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
