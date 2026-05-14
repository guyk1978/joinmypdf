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
import { ctaPrimary, ctaSecondary } from "@/lib/cta-styles";

export const metadata: Metadata = {
  title: "JoinMyPDF — merge, compress & split PDFs in your browser",
  description:
    "Merge, compress, split, and convert PDFs in your browser. No uploads to our servers, no watermark on standard output, no signup required to start.",
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
      <main className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        {/* Phase 1 — Hero */}
        <section className="text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-[2.75rem] md:leading-[1.1]">
              Merge, compress, and edit PDFs in your browser—nothing is uploaded to our servers.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted md:text-xl">
              JoinMyPDF runs merge, compress, split, and conversions locally for speed and privacy. No install, no queue,
              no watermark on standard downloads.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link href="/tools/pdf-merge/" className={ctaPrimary}>
                Start Free
              </Link>
              <Link href="/tools/" className={ctaSecondary}>
                View Tools
              </Link>
            </div>
            <p className="mt-6 text-sm font-medium tracking-wide text-ink-muted">
              No uploads • No signup • Instant processing
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <HeroDropzone />
          </div>
        </section>

        {/* Phase 4 — Tools */}
        <section className="mt-20 space-y-5 md:mt-24">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">Pick a tool</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-muted md:mx-0 md:text-base">
              Every workflow opens in one click—same layout, same privacy model.
            </p>
          </div>
          <ToolGrid />
        </section>

        {/* Phase 4 — Scenarios */}
        <div className="mt-20 md:mt-24">
          <ScenarioWins />
        </div>

        {/* Phase 2 + 4 — Trust */}
        <div className="mt-20 md:mt-24">
          <TrustBadges />
        </div>

        {/* Browser strip */}
        <div className="mt-12 md:mt-16">
          <SocialProofStrip />
        </div>

        {/* Guides */}
        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center md:mt-20">
          <h2 className="text-xl font-semibold text-ink md:text-2xl">Guides for email, mobile & submissions</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted md:text-base">
            Short tutorials that link straight into the tools so your team can repeat the same steps every time.
          </p>
          <Link href="/blog/" className={`${ctaSecondary} mt-8 inline-flex`}>
            View Guides
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
