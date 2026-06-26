import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAdSense />
      </head>
      <body className={`${inter.variable} theme-transition font-sans`}>{children}</body>
    </html>
  );
}
