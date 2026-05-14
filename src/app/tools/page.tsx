import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { registry } from "@/lib/registry";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All PDF tools",
  description: "Browse JoinMyPDF merge, split, compress, and image conversion tools—all with local browser processing.",
  alternates: { canonical: "/tools/" },
};

export default function ToolsHubPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-ink">All tools</h1>
          <p className="max-w-2xl text-ink-muted">
            Same privacy model everywhere: your files stay on-device while you work, with no watermark on standard
            output.
          </p>
        </header>
        <ul className="grid gap-3 md:grid-cols-2">
          {registry.tools.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/tools/${t.slug}/`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40"
              >
                <span className="text-lg font-semibold text-ink">{t.title}</span>
                <p className="mt-1 text-sm text-ink-muted">{t.intent}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
