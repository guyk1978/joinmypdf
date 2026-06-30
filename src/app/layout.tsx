import type { ReactNode } from "react";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import "./globals.css";

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
