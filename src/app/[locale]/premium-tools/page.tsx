import type { Metadata } from "next";
export const runtime = "edge";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { PremiumToolsHero } from "@/components/PremiumToolsHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolsDirectoryToolGrid } from "@/components/ToolsDirectoryToolGrid";
import { Link } from "@/i18n/navigation";
import { buildPremiumToolItems } from "@/lib/premium-tools";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { homeSecondaryPillBtn } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PremiumTools" });
  const social = buildDefaultSocialImages(locale, { alt: t("title") });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/premium-tools` },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: absoluteUrl(`/${locale}/premium-tools`),
      ...social.openGraph,
    },
    twitter: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      ...social.twitter,
    },
  };
}

export default async function PremiumToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("PremiumTools");
  const items = buildPremiumToolItems(tTools);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tPage("title"),
          description: tPage("metaDescription"),
          url: absoluteUrl(`/${locale}/premium-tools`),
          numberOfItems: items.length,
        }}
      />
      <div className="home-page-shell min-h-screen text-black dark:text-white">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="home-tool-grid-page">
          <PremiumToolsHero />

          <div className="tools-directory-content home-tool-grid-shell mx-auto w-full max-w-[1440px]">
            <ToolsDirectoryToolGrid items={items} />

            <div className="mt-12 flex justify-center pb-4">
              <Link href="/tools/" className={homeSecondaryPillBtn} prefetch={false}>
                {tPage("browseAllTools")}
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter tagline="tools" />
      </div>
    </>
  );
}
