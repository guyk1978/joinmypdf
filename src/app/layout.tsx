import type { ReactNode } from "react";
import type { Viewport } from "next";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { assistant, heebo } from "@/lib/fonts";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
