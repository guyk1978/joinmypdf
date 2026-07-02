import type { ReactNode } from "react";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { HomepageHeadJsonLd } from "@/components/HomepageHeadJsonLd";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <GoogleAdSense />
        <HomepageHeadJsonLd />
      </head>
      <body className="font-sans text-white antialiased">{children}</body>
    </html>
  );
}
