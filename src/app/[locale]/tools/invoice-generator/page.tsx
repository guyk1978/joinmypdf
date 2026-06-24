import type { Metadata } from "next";
export const runtime = "edge";
import Link from "next/link";
import { BrandEyebrow } from "@/components/BrandEyebrow";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";
import { INVOICE_TEMPLATE_PROFILES } from "@/lib/invoice/templates";
import { getBrandName } from "@/lib/brand";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fast Invoice & Receipt Generator",
  description:
    "Create professional invoices and receipts in your browser. Real-time A4 preview, line items, tax, and client-side PDF export—nothing uploaded to our servers.",
  alternates: { canonical: "/tools/invoice-generator/" },
};

type PageProps = { params: Promise<{ locale: string }> };

export default async function InvoiceGeneratorPage({ params }: PageProps) {
  const { locale } = await params;
  const brand = getBrandName(locale);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${brand} Invoice Generator`,
          url: absoluteUrl("/tools/invoice-generator/"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Client-side invoice and receipt builder with live A4 preview and PDF download.",
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-4 md:py-12">
        <header className="mb-4 max-w-3xl space-y-3">
          <BrandEyebrow />
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Fast Invoice &amp; Receipt Generator
          </h1>
          <p className="text-lg leading-relaxed text-ink-muted">
            Build a polished invoice with a live A4 preview. All processing stays in your browser—no
            uploads, no account required.
          </p>
        </header>

        <InvoiceGenerator />

        <section className="mt-12 rounded-none border border-white/10 bg-white/[0.02] p-4 md:p-4">
          <h2 className="text-xl font-semibold text-ink">Templates by profession</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted md:text-base">
            Start from a pre-filled invoice for your trade—line items and sample rates included.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {INVOICE_TEMPLATE_PROFILES.map((profile) => (
              <li key={profile.slug}>
                <Link
                  href={`/templates/${profile.slug}/`}
                  className="inline-flex rounded-none border border-white/10 bg-white/[0.03] px-3 py-1.5 text-ink transition hover:border-neutral-300 dark:border-neutral-800 hover:text-black dark:text-neutral-200"
                >
                  {profile.professionLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-none border border-white/10 bg-white/[0.02] p-4 md:p-4">
          <h2 className="text-xl font-semibold text-ink">Privacy-first by design</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted md:text-base">
            Your invoice data never leaves your device during editing. Download uses the same client-side
            pdf-lib stack as our merge and sign tools: the live A4 preview is captured and saved as a PDF
            locally—no server upload.
          </p>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
