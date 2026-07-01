import type { Metadata } from "next";

export const runtime = "edge";

import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeDeveloperToolItems } from "@/lib/developer-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("developerToolsDirectoryTitle"),
    description: t("developerToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/developer-tools` },
  };
}

export default async function DeveloperToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const developerItems = buildHomeDeveloperToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("developerToolsDirectoryTitle"),
          description: tHome("developerToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/developer-tools`),
          numberOfItems: developerItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("developerToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="developer-tools-directory"
            title={tHome("developerSectionTitle")}
            viewAllHref="/"
            viewAllLabel={tHome("backToHome")}
            hideTitle
          >
            {developerItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                developerIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>
        </div>
      </AppPageShell>
    </>
  );
}
