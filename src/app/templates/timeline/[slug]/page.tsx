import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TimelineGenerator } from "@/components/timeline/TimelineGenerator";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  createTimelineProjectForTemplate,
  getTimelineTemplateBySlug,
  TIMELINE_TEMPLATE_PROFILES,
} from "@/lib/timeline/templates";
import { breadcrumbLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { ctaSecondary } from "@/lib/cta-styles";

export const runtime = "edge";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TIMELINE_TEMPLATE_PROFILES.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getTimelineTemplateBySlug(slug);
  if (!profile) return {};

  const canonicalPath = `/templates/timeline/${profile.slug}/`;
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
      images: [
        {
          url: absoluteUrl(`${canonicalPath}opengraph-image`),
          width: 1200,
          height: 630,
          alt: profile.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: profile.metaTitle,
      description: profile.metaDescription,
      images: [absoluteUrl(`${canonicalPath}opengraph-image`)],
    },
  };
}

export default async function TimelineTemplatePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = getTimelineTemplateBySlug(slug);
  if (!profile) notFound();

  const initialProject = createTimelineProjectForTemplate(profile);
  const pathname = `/templates/timeline/${profile.slug}/`;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Timeline & Gantt generator", path: "/tools/timeline-gantt-generator/" },
    { name: profile.professionLabel, path: pathname },
  ];

  const otherTemplates = TIMELINE_TEMPLATE_PROFILES.filter((p) => p.slug !== profile.slug);

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
            Need a blank timeline instead?{" "}
            <Link href="/tools/timeline-gantt-generator/" className="text-brand hover:underline">
              Open the general timeline &amp; Gantt generator
            </Link>
            .
          </p>
        </header>

        <TimelineGenerator
          key={profile.slug}
          initialProject={initialProject}
          templateSlug={profile.slug}
        />

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">More free timeline templates</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Each page pre-fills tasks and milestones for a specific workflow. Everything runs in your
            browser—edit, preview, and download a landscape PDF without uploading data.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherTemplates.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/templates/timeline/${t.slug}/`}
                  className="block rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-ink transition hover:border-brand/35 hover:bg-brand/5"
                >
                  {t.professionLabel}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/tools/timeline-gantt-generator/"
            className={`${ctaSecondary} mt-6 inline-flex`}
          >
            Blank timeline generator
          </Link>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
