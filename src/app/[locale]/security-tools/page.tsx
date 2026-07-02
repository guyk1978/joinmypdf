import type { Metadata } from "next";


import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeSecurityToolItems } from "@/lib/security-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("securityToolsDirectoryTitle"),
    description: t("securityToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/security-tools` },
  };
}

export default async function SecurityToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const securityItems = buildHomeSecurityToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("securityToolsDirectoryTitle"),
          description: tHome("securityToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/security-tools`),
          numberOfItems: securityItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("securityToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="security-tools-directory"
            title={tHome("securitySectionTitle")}
            viewAllHref="/"
            viewAllLabel={tHome("backToHome")}
            hideTitle
          >
            {securityItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                securityIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>
        </div>
      </AppPageShell>
    </>
  );
}
