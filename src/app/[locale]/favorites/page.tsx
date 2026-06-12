import type { Metadata } from "next";
export const runtime = "edge";
import { FavoritesHero } from "@/components/FavoritesHero";
import { FavoritesToolGrid } from "@/components/FavoritesToolGrid";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { buildAllHomeToolItems } from "@/lib/featured-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Favorites" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/favorites`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}/favorites`])),
    },
  };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations("Tools");
  const t = await getTranslations("Favorites");
  const toolItems = buildAllHomeToolItems(tTools);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          url: absoluteUrl(`/${locale}/favorites`),
        }}
      />
      <div className="home-page-shell favorites-page-shell min-h-screen text-neutral-900 dark:text-neutral-100">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="home-tool-grid-page">
          <FavoritesHero />
          <FavoritesToolGrid items={toolItems} />
        </main>
        <SiteFooter tagline="tools" />
      </div>
    </>
  );
}
