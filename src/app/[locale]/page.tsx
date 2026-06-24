import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
export const runtime = "edge";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { HomeToolGrid } from "@/components/HomeToolGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { getBrandName } from "@/lib/brand";
import { buildAllHomeToolItems } from "@/lib/featured-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

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
  const tTools = await getTranslations("Tools");
  const tMeta = await getTranslations("Metadata");
  const toolItems = buildAllHomeToolItems(tTools);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: getBrandName(locale),
          url: absoluteUrl(`/${locale}`),
          description: tMeta("homeDescription"),
        }}
      />
      <div className="home-page-shell min-h-screen text-black dark:text-white">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="home-tool-grid-page">
          <HomeToolGrid items={toolItems} />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
