import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import { ShareButton } from "@/components/ShareButton";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JoinMyPDF — Private PDF tools in your browser",
    template: "%s | JoinMyPDF",
  },
  description:
    "Merge, split, compress, and convert PDFs locally in your browser. No watermark on standard output, no forced signup for typical use, and files stay on your device during processing.",
  openGraph: {
    type: "website",
    siteName: "JoinMyPDF",
    title: "JoinMyPDF — Private PDF tools in your browser",
    description:
      "Merge, split, compress, and convert PDFs locally in your browser. No watermark on standard output.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "JoinMyPDF — Private PDF tools in your browser",
    description:
      "Merge, split, compress, and convert PDFs locally in your browser. No watermark on standard output.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          <ScrollDepthTracker />
          {children}
          <ShareButton />
        </Providers>
      </body>
    </html>
  );
}
