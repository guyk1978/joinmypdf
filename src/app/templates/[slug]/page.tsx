import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  createInvoiceDocumentForTemplate,
  getInvoiceTemplateBySlug,
  INVOICE_TEMPLATE_PROFILES,
} from "@/lib/invoice/templates";
import { breadcrumbLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { ctaSecondary } from "@/lib/cta-styles";

export const runtime = "edge";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return INVOICE_TEMPLATE_PROFILES.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getInvoiceTemplateBySlug(slug);
  if (!profile) return {};

  const canonicalPath = `/templates/${profile.slug}/`;
  const pageUrl = absoluteUrl(canonicalPath);

  return {
    title: profile.metaTitle,
    description: profile.metaDescription,
    keywords: profile.keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: profile.metaTitle,
      description: profile.metaDescription,
      url: pageUrl,
      siteName: "JoinMyPDF",
      locale: profile.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: profile.metaTitle,
      description: profile.metaDescription,
    },
  };
}

export default async function InvoiceTemplatePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = getInvoiceTemplateBySlug(slug);
  if (!profile) notFound();

  const initialDocument = createInvoiceDocumentForTemplate(profile);
  const pathname = `/templates/${profile.slug}/`;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Invoice generator", path: "/tools/invoice-generator/" },
    { name: profile.metaTitle, path: pathname },
  ];

  const otherTemplates = INVOICE_TEMPLATE_PROFILES.filter((p) => p.slug !== profile.slug);

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: profile.metaTitle,
          url: absoluteUrl(pathname),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          inLanguage: profile.locale,
          description: profile.metaDescription,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <header className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {profile.professionLabel} template
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{profile.h1}</h1>
          <p className="text-lg leading-relaxed text-ink-muted">{profile.lede}</p>
          <p className="text-sm text-ink-muted">
            Need a blank invoice instead?{" "}
            <Link href="/tools/invoice-generator/" className="text-brand hover:underline">
              Open the general invoice generator
            </Link>
            .
          </p>
        </header>

        <InvoiceGenerator
          key={profile.slug}
          initialDocument={initialDocument}
          templateSlug={profile.slug}
        />

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">More free invoice templates</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Each page pre-fills line items for a specific trade or freelance role. Everything runs in
            your browser—edit, preview, and download without uploading data.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherTemplates.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/templates/${t.slug}/`}
                  className="block rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-ink transition hover:border-brand/35 hover:bg-brand/5"
                >
                  {t.professionLabel}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/tools/invoice-generator/" className={`${ctaSecondary} mt-6 inline-flex`}>
            Blank invoice generator
          </Link>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
