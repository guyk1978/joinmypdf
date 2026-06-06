import type { Metadata } from "next";
export { runtime } from "@/lib/cloudflare-runtime";
import Link from "next/link";
import { Lock, Shield } from "lucide-react";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSearch } from "@/components/SiteSearch";
import { blogRegistry } from "@/lib/blog-registry";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "All PDF tools — merge, compress, convert, sign & protect",
  description:
    "Browse every JoinMyPDF tool in one directory. Merge, compress, split, convert, sign, and protect PDFs locally in your browser—no uploads to our servers.",
  alternates: { canonical: "/tools/" },
  openGraph: {
    title: "All PDF tools | JoinMyPDF",
    description:
      "Full directory of private, browser-based PDF tools—merge, compress, convert, sign, and protect workflows.",
    url: absoluteUrl("/tools/"),
  },
};

const FEATURED_SLUGS = [
  "pdf-merge",
  "pdf-compress",
  "jpg-to-pdf",
  "sign-pdf",
  "protect-pdf",
] as const;

export default function ToolsDirectoryPage() {
  const sections = buildMegaMenuSections();
  const toolCount = registry.tools.length + 3;

  const featuredItems = FEATURED_SLUGS.map((slug) => {
    const tool = registry.tools.find((t) => t.slug === slug);
    if (!tool) return null;
    return {
      href: `/tools/${tool.slug}/`,
      label: tool.title,
      slugHint: tool.slug,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "All PDF tools",
          description:
            "Directory of browser-based PDF tools for merge, compress, convert, sign, and protect workflows.",
          url: absoluteUrl("/tools/"),
          numberOfItems: toolCount,
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 px-6 py-10 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_0_48px_-16px_rgba(100,200,255,0.18)] md:px-10 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/80 via-transparent to-blue-50/40 dark:from-white/[0.03] dark:via-transparent dark:to-cyan-500/[0.06]"
            aria-hidden
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-cyan-300/80">
              Tool directory
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-5xl">
              All PDF tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
              {toolCount}+ workflows for merge, compress, convert, sign, and protect—every tool runs locally in your
              browser. No uploads to our servers.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <SiteSearch variant="hero" registry={registry} blog={blogRegistry} />
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Client-side processing
              </span>
              <span className="hidden text-slate-300 sm:inline dark:text-slate-700" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <Link href="/privacy-first/" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                  Privacy First
                </Link>
              </span>
            </p>
          </div>
        </section>

        <section className="mt-12 space-y-4" aria-labelledby="featured-tools">
          <div>
            <h2 id="featured-tools" className="text-xl font-semibold text-slate-900 dark:text-white md:text-2xl">
              Start here
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Popular merge, compress, convert, sign, and protect workflows.
            </p>
          </div>
          <CompactToolCardGrid items={featuredItems} />
        </section>

        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="mt-14 scroll-mt-24 space-y-5 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_0_32px_-20px_rgba(100,200,255,0.12)] md:p-8"
            aria-labelledby={`section-${section.id}`}
          >
            <div>
              <h2
                id={`section-${section.id}`}
                className="text-lg font-semibold text-slate-900 dark:text-white md:text-xl"
              >
                {section.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {section.items.length} tool{section.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <CompactToolCardGrid
              items={section.items.map((item) => ({
                href: item.href,
                label: item.label,
                slugHint: item.slug,
              }))}
            />
          </section>
        ))}

        <section className="mt-14 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-6 py-8 text-center dark:border-emerald-500/20 dark:bg-emerald-950/20 md:px-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Why local processing matters</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
            Upload-based PDF sites copy your file to their servers. JoinMyPDF delivers JavaScript; your browser does
            the work. Open DevTools → Network and verify—your PDF never leaves your device.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/privacy-first/"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              Learn about Privacy First
            </Link>
            <Link
              href="/blog/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              View guides
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
