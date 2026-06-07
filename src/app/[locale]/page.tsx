import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
export const runtime = "edge";
import { FeaturedToolsShowcase } from "@/components/FeaturedToolsShowcase";
import { HomeWatermarkBackground } from "@/components/HomeWatermarkBackground";
import { HeroDropzone } from "@/components/HeroDropzone";
import { MapDiagramCrossLink } from "@/components/partner/MapDiagramCrossLink";
import { ScenarioWins } from "@/components/ScenarioWins";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSearch } from "@/components/SiteSearch";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { buildFeaturedHomeToolItems, getTotalToolCount } from "@/lib/featured-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { ctaSecondary } from "@/lib/cta-styles";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}`])),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tTools = await getTranslations("Tools");

  const tMeta = await getTranslations("Metadata");
  const featuredItems = buildFeaturedHomeToolItems(tTools);
  const toolCount = getTotalToolCount();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "JoinMyPDF",
          url: absoluteUrl(`/${locale}`),
          description: tMeta("homeDescription"),
        }}
      />
      <div className="relative isolate">
        <HomeWatermarkBackground />
        <div className="relative z-10">
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-14 md:px-4 md:py-20">
            <section className="text-center">
              <LocalProcessingInfographic headingAs="h1" />
              <div className="mx-auto mt-4 max-w-2xl">
                <SiteSearch variant="hero" registry={registry} blog={blogRegistry} />
              </div>
              <div className="mx-auto mt-4 max-w-2xl space-y-3 sm:mt-6">
                <HeroDropzone />
                <MapDiagramCrossLink />
              </div>
            </section>

            <FeaturedToolsShowcase items={featuredItems} toolCount={toolCount} />

            <div className="mt-20 md:mt-24">
              <ScenarioWins />
            </div>

            <div className="mt-12 md:mt-16">
              <SocialProofStrip />
            </div>

            <section className="mt-16 grid gap-2 md:grid-cols-2 md:mt-20">
              <div className="rounded-none border border-neutral-300 dark:border-neutral-800/60 bg-white px-4 py-10 text-center dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
                <h2 className="text-xl font-semibold text-black dark:text-neutral-200 dark:text-white md:text-2xl">{t("browseAllTools")}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200 md:text-base">
                  {t("browseAllToolsDescription")}
                </p>
                <Link href="/tools/" className={`${ctaSecondary} mt-6 inline-flex`}>
                  {t("openToolDirectory")}
                </Link>
              </div>
              <div className="rounded-none border border-neutral-300 dark:border-neutral-800/60 bg-white px-4 py-10 text-center dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
                <h2 className="text-xl font-semibold text-black dark:text-neutral-200 dark:text-white md:text-2xl">{t("guidesSection")}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200 md:text-base">
                  {t("guidesSectionDescription")}
                </p>
                <Link href="/blog/" className={`${ctaSecondary} mt-6 inline-flex`}>
                  {t("viewGuides")}
                </Link>
              </div>
            </section>
          </main>
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
