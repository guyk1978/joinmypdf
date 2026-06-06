import type { Metadata } from "next";
import Link from "next/link";
import { HeroDropzone } from "@/components/HeroDropzone";
import { MapDiagramCrossLink } from "@/components/partner/MapDiagramCrossLink";
import { ScenarioWins } from "@/components/ScenarioWins";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSearch } from "@/components/SiteSearch";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { ToolGrid } from "@/components/ToolGrid";
import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { ctaSecondary } from "@/lib/cta-styles";

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
          <LocalProcessingInfographic
            headingAs="h1"
            headline="Seamless PDF tasks, right in your browser, running fully-locally."
          />
          <div className="mx-auto mt-8 max-w-2xl">
            <SiteSearch variant="hero" registry={registry} blog={blogRegistry} />
          </div>
          <div className="mx-auto mt-8 max-w-2xl space-y-3 sm:mt-10">
            <HeroDropzone />
            <MapDiagramCrossLink />
          </div>
        </section>

        {/* Phase 4 — Tools */}
        <section className="mt-20 space-y-5 md:mt-24">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">Pick a tool</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:mx-0 md:text-base">
              Every workflow opens in one click—same layout, same privacy model.
            </p>
          </div>
          <ToolGrid />
        </section>

        {/* Phase 4 — Scenarios */}
        <div className="mt-20 md:mt-24">
          <ScenarioWins />
        </div>

        {/* Browser strip */}
        <div className="mt-12 md:mt-16">
          <SocialProofStrip />
        </div>

        {/* Guides */}
        <section className="mt-16 grid gap-4 md:grid-cols-2 md:mt-20">
          <div className="rounded-2xl border border-slate-200/60 bg-white px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white md:text-2xl">Browse all tools</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Full directory of merge, compress, convert, sign, and protect workflows—including long-tail pages for
              mobile, deadlines, and sensitive documents.
            </p>
            <Link href="/tools/" className={`${ctaSecondary} mt-6 inline-flex`}>
              Open tool directory
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white md:text-2xl">Guides for email, mobile &amp; submissions</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Short tutorials that link straight into the tools so your team can repeat the same steps every time.
            </p>
            <Link href="/blog/" className={`${ctaSecondary} mt-6 inline-flex`}>
              View Guides
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
