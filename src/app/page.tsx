import type { Metadata } from "next";
import Link from "next/link";
import { HeroDropzone } from "@/components/HeroDropzone";
import { ScenarioWins } from "@/components/ScenarioWins";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { ToolGrid } from "@/components/ToolGrid";
import { TrustBadges } from "@/components/TrustBadges";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "JoinMyPDF — merge, compress & split PDFs privately",
  description:
    "Premium-feeling PDF tools that run in your browser. Files stay on your device, no watermark on standard output, and no forced account for typical use.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "JoinMyPDF",
          url: absoluteUrl("/"),
          description:
            "Browser-based PDF merge, split, compress, and image conversion with local processing.",
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-16 px-4 py-12 md:px-6 md:py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Private · fast · no upload</p>
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
              PDF tools that feel premium—because your files never leave your browser.
            </h1>
            <p className="max-w-2xl text-lg text-ink-muted">
              Merge, split, compress, and convert without sending documents to a remote processing queue. Built for
              teams that care about control, clarity, and clean downloads—without watermarks on standard output.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tools/pdf-merge/"
                className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/30 hover:bg-brand-deep"
              >
                Start merging PDFs
              </Link>
              <Link
                href="/privacy-first-pdf-tools/"
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-ink hover:bg-white/5"
              >
                Why local processing
              </Link>
            </div>
          </div>
          <HeroDropzone />
        </section>

        <TrustBadges />

        <SocialProofStrip />

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-semibold text-ink">Tools</h2>
            <p className="text-sm text-ink-muted">Pick a workflow—each page explains privacy, steps, and next actions.</p>
          </div>
          <ToolGrid />
        </section>

        <ScenarioWins />

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
          <h2 className="text-xl font-semibold text-ink">Need guides for email, mobile, or submissions?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-muted">
            Practical articles that link straight into the tools—written for humans, not keyword spreadsheets.
          </p>
          <Link
            href="/blog/"
            className="mt-6 inline-flex rounded-xl border border-brand/40 bg-brand/10 px-5 py-3 text-sm font-semibold text-brand hover:bg-brand/20"
          >
            Browse guides
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
