import { Assistant, Heebo } from "next/font/google";

/**
 * Clean Hebrew-capable sans — used for RTL/Hebrew headings sitewide.
 * preload: false avoids competing with LCP on Latin locales (body uses Arial;
 * these faces only apply under html[lang=he] / dir=rtl).
 */
export const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-assistant",
  display: "swap",
  preload: false,
});

export const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heebo",
  display: "swap",
  preload: false,
});
