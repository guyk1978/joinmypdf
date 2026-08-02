import type { ReactNode } from "react";
import type { Viewport } from "next";

/** Allow pinch-zoom (Lighthouse a11y); keep cover safe-area for notched devices. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Root shell — no sitewide CSS / ads / Hebrew fonts here.
 * Welcome splash stays light; app routes load those via (site) layout.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans text-white antialiased">{children}</body>
    </html>
  );
}
