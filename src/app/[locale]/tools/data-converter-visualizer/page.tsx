import type { Metadata } from "next";
import { DataToolDashboard } from "@/components/data-tool/DataToolDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Universal Data Converter & Visualizer",
  description:
    "Convert and clean CSV, JSON, and XML in your browser. Sort, dedupe, trim cells, and download exports—100% client-side with no uploads.",
  alternates: { canonical: "/tools/data-converter-visualizer/" },
};

export default function DataConverterVisualizerPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "JoinMyPDF Universal Data Converter & Visualizer",
          url: absoluteUrl("/tools/data-converter-visualizer/"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Client-side CSV, JSON, and XML converter with interactive data grid and instant downloads.",
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <header className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">JoinMyPDF</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Universal Data Converter &amp; Visualizer
          </h1>
          <p className="text-lg leading-relaxed text-ink-muted">
            Upload CSV or JSON, preview rows in a sortable grid, run quick clean-up actions, and export
            to CSV, JSON, or XML—all locally in your browser.
          </p>
        </header>

        <DataToolDashboard />

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">How it works</h2>
          <ul className="mt-4 max-w-3xl list-inside list-disc space-y-2 text-sm leading-relaxed text-ink-muted md:text-base">
            <li>Drop a .csv or .json file—or load demo sales data to explore the workspace.</li>
            <li>Sort by any column, trim whitespace, fill blanks, or remove duplicate rows.</li>
            <li>Export the current grid as CSV, pretty-printed JSON, or structured XML.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Privacy-first by design</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted md:text-base">
            Your datasets never leave your device. Parsing, visualization, and downloads use native browser
            APIs only—no server upload and no heavy parsing libraries bundled into the page.
          </p>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
