import type { Metadata } from "next";
export const runtime = "edge";
import Link from "next/link";
import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { registry } from "@/lib/registry";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = "Privacy-first PDF tools";
  const description =
    "A hub page for teams that need PDF utilities without routing confidential files through unknown servers.";
  const social = buildDefaultSocialImages(locale, { alt: title });

  return {
    title,
    description,
    alternates: { canonical: `/${locale}/privacy-first-pdf-tools/` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${locale}/privacy-first-pdf-tools/`),
      ...social.openGraph,
    },
    twitter: {
      title,
      description,
      ...social.twitter,
    },
  };
}

export default async function PillarPage({ params }: Props) {
  await params;
  const featuredSlugs = ["pdf-merge", "pdf-compress", "pdf-split"] as const;
  const featuredTools = featuredSlugs
    .map((slug) => registry.tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof registry.tools)[number] => Boolean(tool));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Privacy-first PDF tools",
          url: absoluteUrl("/privacy-first-pdf-tools/"),
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">Privacy-first PDF tools</h1>
          <p className="home-minimal-section__title !mb-6 !text-center !normal-case !tracking-normal">
            Merge, compress, and split PDFs on your device — without routing files through unknown servers.{" "}
            <Link className="home-minimal-section__link" href="/privacy/">
              Read our privacy policy
            </Link>
            .
          </p>
          <HomeFeaturedSection
            id="privacy-first-featured"
            title="Featured tools"
            viewAllHref="/tools/"
            viewAllLabel="View all PDF tools"
            hideTitle
          >
            {featuredTools.map((tool) => (
              <HomeFeaturedToolCard
                key={tool.slug}
                href={`/tools/${tool.slug}/`}
                label={tool.title}
                slugHint={tool.slug}
              />
            ))}
          </HomeFeaturedSection>
          <p className="home-minimal-section__footer">
            <Link href="/blog/" className="home-minimal-section__link">
              Browse guides
            </Link>
          </p>
        </div>
      </AppPageShell>
    </>
  );
}
