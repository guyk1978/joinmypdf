import type { Metadata } from "next";


import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeUtilityToolSections } from "@/lib/utilities-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("utilitiesDirectoryTitle"),
    description: t("utilitiesDirectoryDescription"),
    alternates: { canonical: `/${locale}/utilities` },
  };
}

export default async function UtilitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const { faviconItems, textJsonItems } = buildHomeUtilityToolSections(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("utilitiesDirectoryTitle"),
          description: tHome("utilitiesDirectoryDescription"),
          url: absoluteUrl(`/${locale}/utilities`),
          numberOfItems: faviconItems.length + textJsonItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("utilitiesDirectoryTitle")}</h1>

          <HomeFeaturedSection
            id="utilities-favicon-tools"
            title={tHome("faviconSectionTitle")}
            viewAllHref="/favicon-tools/"
            viewAllLabel={tHome("viewAllFaviconTools")}
            className="home-minimal-section--favicon"
            hideTitle
          >
            {faviconItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                faviconIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>

          <HomeFeaturedSection
            id="utilities-text-json-tools"
            title={tHome("textJsonSectionTitle")}
            viewAllHref="/text-json-tools/"
            viewAllLabel={tHome("viewAllTextJsonTools")}
            className="home-minimal-section--text-json"
            hideTitle
          >
            {textJsonItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                textJsonIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>
        </div>
      </AppPageShell>
    </>
  );
}
