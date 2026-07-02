import type { Metadata } from "next";


import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeDataConversionToolItems } from "@/lib/data-conversion-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("dataConversionToolsDirectoryTitle"),
    description: t("dataConversionToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/data-conversion-tools` },
  };
}

export default async function DataConversionToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const dataConversionItems = buildHomeDataConversionToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("dataConversionToolsDirectoryTitle"),
          description: tHome("dataConversionToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/data-conversion-tools`),
          numberOfItems: dataConversionItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("dataConversionToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="data-conversion-tools-directory"
            title={tHome("dataConversionSectionTitle")}
            viewAllHref="/"
            viewAllLabel={tHome("backToHome")}
            hideTitle
          >
            {dataConversionItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                dataConversionIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>
        </div>
      </AppPageShell>
    </>
  );
}
