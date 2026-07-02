import type { Metadata } from "next";


import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeProductivityToolItems } from "@/lib/productivity-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("productivityToolsDirectoryTitle"),
    description: t("productivityToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/productivity-tools` },
  };
}

export default async function ProductivityToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const productivityItems = buildHomeProductivityToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("productivityToolsDirectoryTitle"),
          description: tHome("productivityToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/productivity-tools`),
          numberOfItems: productivityItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("productivityToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="productivity-tools-directory"
            title={tHome("productivitySectionTitle")}
            viewAllHref="/"
            viewAllLabel={tHome("backToHome")}
            hideTitle
          >
            {productivityItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                productivityIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>
        </div>
      </AppPageShell>
    </>
  );
}
