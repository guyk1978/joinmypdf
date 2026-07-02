import type { Metadata } from "next";


import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeTextJsonToolItems } from "@/lib/text-json-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("textJsonToolsDirectoryTitle"),
    description: t("textJsonToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/text-json-tools` },
  };
}

export default async function TextJsonToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const textJsonItems = buildHomeTextJsonToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("textJsonToolsDirectoryTitle"),
          description: tHome("textJsonToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/text-json-tools`),
          numberOfItems: textJsonItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("textJsonToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="text-json-tools-directory"
            title={tHome("textJsonSectionTitle")}
            viewAllHref="/utilities/"
            viewAllLabel={tHome("viewAllUtilities")}
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
