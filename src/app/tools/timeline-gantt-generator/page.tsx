import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TimelineGenerator } from "@/components/timeline/TimelineGenerator";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Timeline & Gantt Chart Generator",
  description:
    "Build project timelines and Gantt charts in your browser. Add tasks, milestones, and dates—then download a landscape PDF. Nothing uploaded to our servers.",
  alternates: { canonical: "/tools/timeline-gantt-generator/" },
};

export default function TimelineGanttGeneratorPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "JoinMyPDF Timeline & Gantt Chart Generator",
          url: absoluteUrl("/tools/timeline-gantt-generator/"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Client-side timeline and Gantt chart builder with live preview and landscape PDF export.",
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <header className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">JoinMyPDF</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Timeline &amp; Gantt Chart Generator
          </h1>
          <p className="text-lg leading-relaxed text-ink-muted">
            Plan deployments, releases, or any multi-phase project with a sleek dark Gantt preview. Edit
            tasks and milestones locally, then export a landscape PDF—no account and no uploads.
          </p>
        </header>

        <TimelineGenerator />

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">How it works</h2>
          <ul className="mt-4 max-w-3xl list-inside list-disc space-y-2 text-sm leading-relaxed text-ink-muted md:text-base">
            <li>Add tasks with start and end dates; bars scale automatically on the time grid.</li>
            <li>Place milestones as diamond markers on a dedicated row above the schedule.</li>
            <li>Reorder rows with the row index field to control vertical stacking.</li>
            <li>Download captures the chart area via html2canvas and pdf-lib—same stack as our invoice tool.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Privacy-first by design</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted md:text-base">
            Your project data never leaves your device during editing. PDF export runs entirely in the
            browser: the live chart is rasterized and saved locally—no server processing.
          </p>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
