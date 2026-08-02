import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";
import { AppPageShell } from "@/components/AppPageShell";
import {
  createInvoiceDocumentForTemplate,
  getInvoiceTemplateBySlug,
  INVOICE_TEMPLATE_PROFILES,
} from "@/lib/invoice/templates";
import { breadcrumbLd, faqLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { ctaSecondary } from "@/lib/cta-styles";

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
  const faqs = profile.faq ?? [];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Invoice generator", path: "/tools/invoice-generator/" },
    { name: profile.h1, path: pathname },
  ];

  const otherTemplates = INVOICE_TEMPLATE_PROFILES.filter((p) => p.slug !== profile.slug);

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: profile.h1,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          browserRequirements: "Requires JavaScript. Requires HTML5.",
          inLanguage: profile.locale,
          description: profile.metaDescription,
          url: absoluteUrl(pathname),
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: profile.keywords,
          provider: {
            "@type": "Organization",
            name: "JoinMyPDF",
            url: absoluteUrl("/"),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: profile.detailTitle || profile.h1,
          description: profile.metaDescription,
          url: absoluteUrl(pathname),
          inLanguage: profile.locale,
          keywords: profile.keywords.join(", "),
          genre: "Invoice template",
          isAccessibleForFree: true,
          creator: {
            "@type": "Organization",
            name: "JoinMyPDF",
            url: absoluteUrl("/"),
          },
          about: {
            "@type": "Thing",
            name: `${profile.professionLabel} professional documents`,
          },
        }}
      />
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}

      <AppPageShell mainClassName="mx-auto max-w-7xl px-4 py-10 md:px-4 md:py-12">
        <header className="mb-4 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black dark:text-neutral-200">
            {profile.professionLabel} template
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{profile.h1}</h1>
          <p className="text-lg leading-relaxed text-ink-muted">{profile.lede}</p>
          <p className="text-sm text-ink-muted">
            Need a blank invoice instead?{" "}
            <Link href="/tools/invoice-generator/" className="text-black dark:text-neutral-200 hover:underline">
              Open the general invoice generator
            </Link>
            .
          </p>
        </header>

        <InvoiceGenerator
          key={profile.slug}
          initialDocument={initialDocument}
          templateSlug={profile.slug}
          previewAlt={profile.previewAlt}
        />

        {profile.detailTitle && profile.detailParagraphs?.length ? (
          <section
            className="mt-12 max-w-3xl space-y-4 rounded-none border border-white/10 bg-white/[0.02] p-4 md:p-6"
            aria-labelledby="template-detail-title"
          >
            <h2 id="template-detail-title" className="text-xl font-semibold text-ink md:text-2xl">
              {profile.detailTitle}
            </h2>
            {profile.detailParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-base leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        {faqs.length ? (
          <section
            className="mt-10 max-w-3xl rounded-none border border-white/10 bg-white/[0.02] p-4 md:p-6"
            aria-labelledby="template-faq-title"
          >
            <h2 id="template-faq-title" className="text-xl font-semibold text-ink">
              Frequently asked questions
            </h2>
            <div className="mt-6 flex flex-col gap-4">
              {faqs.map((item) => (
                <details key={item.q} className="privacy-faq-item group">
                  <summary className="privacy-faq-item__summary">{item.q}</summary>
                  <p className="privacy-faq-item__body">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-none border border-white/10 bg-white/[0.02] p-4 md:p-4">
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
                  className="block rounded-none border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-ink transition hover:border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800"
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

        <nav
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-8 text-sm"
          aria-label="Related pages"
        >
          <Link href="/tools/" className="font-semibold text-ink hover:underline" prefetch={false}>
            Tools
          </Link>
          <Link href="/privacy/" className="font-semibold text-ink hover:underline" prefetch={false}>
            Privacy Policy
          </Link>
          <Link
            href="/tools/invoice-generator/"
            className="text-ink-muted hover:underline"
            prefetch={false}
          >
            Invoice generator
          </Link>
        </nav>
      </AppPageShell>
    </>
  );
}
