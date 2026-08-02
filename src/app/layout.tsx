import type { ReactNode } from "react";
import type { Viewport } from "next";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { assistant, heebo } from "@/lib/fonts";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Root shell — no sitewide CSS here.
 * Welcome splash loads critical-splash.css; app routes load globals via (site) layout.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${assistant.variable} ${heebo.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans text-white antialiased">
        <GoogleAdSense />
        {children}
      </body>
    </html>
  );
}
