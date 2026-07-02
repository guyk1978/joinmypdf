import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { buildHomeImageToolItems } from "@/lib/image-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("imageToolsDirectoryTitle"),
    description: t("imageToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/image-tools` },
  };
}

export default async function ImageToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const imageItems = buildHomeImageToolItems(tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tHome("imageToolsDirectoryTitle"),
          description: tHome("imageToolsDirectoryDescription"),
          url: absoluteUrl(`/${locale}/image-tools`),
          numberOfItems: imageItems.length,
        }}
      />
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory">
          <h1 className="home-minimal-tagline">{tHome("imageToolsDirectoryTitle")}</h1>
          <HomeFeaturedSection
            id="image-tools-directory"
            title={tHome("imageSectionTitle")}
            viewAllHref="/"
            viewAllLabel={tHome("backToHome")}
            hideTitle
          >
            {imageItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.id}
                href={item.href}
                label={item.label}
                slugHint={item.id}
                imageIconKey={item.iconKey}
              />
            ))}
          </HomeFeaturedSection>
        </div>
      </AppPageShell>
    </>
  );
}
