import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { Link } from "@/i18n/navigation";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { registry } from "@/lib/registry";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";

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
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout
          title="Privacy-first PDF tools"
          description="Merge, compress, and split PDFs on your device — without routing files through unknown servers."
          variant="dashboard"
          showPrivacyBadge
        >
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
          <p className="mt-6 text-sm text-neutral-400">
            <Link href="/privacy/" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
              Read our privacy policy
            </Link>
            {" · "}
            <Link href="/blog/" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
              Browse guides
            </Link>
          </p>
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
