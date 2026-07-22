import type { ReactNode } from "react";
import type { Viewport } from "next";
import { GoogleAdSense } from "@/components/GoogleAdSense";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <GoogleAdSense />
      </head>
      <body className="font-sans text-white antialiased">{children}</body>
    </html>
  );
}
