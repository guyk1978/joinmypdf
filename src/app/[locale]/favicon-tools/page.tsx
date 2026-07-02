import type { Metadata } from "next";


import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeFaviconToolItems } from "@/lib/favicon-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("faviconToolsDirectoryTitle"),
    description: t("faviconToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/favicon-tools` },
  };
}

export default async function FaviconToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const faviconItems = buildHomeFaviconToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("faviconToolsDirectoryTitle"),
          description: tHome("faviconToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/favicon-tools`),
          numberOfItems: faviconItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("faviconToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="favicon-tools-directory"
            title={tHome("faviconSectionTitle")}
            viewAllHref="/utilities/"
            viewAllLabel={tHome("viewAllUtilities")}
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
        </div>
      </AppPageShell>
    </>
  );
}
