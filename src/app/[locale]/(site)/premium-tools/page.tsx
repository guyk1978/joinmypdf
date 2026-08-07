import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { buildPremiumToolItems } from "@/lib/premium-tools";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PremiumTools" });
  const social = buildDefaultSocialImages(locale, { alt: t("title") });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/premium-tools` },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: absoluteUrl(`/${locale}/premium-tools`),
      ...social.openGraph,
    },
    twitter: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      ...social.twitter,
    },
  };
}

export default async function PremiumToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("PremiumTools");
  const items = buildPremiumToolItems(tTools);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tPage("title"),
          description: tPage("metaDescription"),
          url: absoluteUrl(`/${locale}/premium-tools`),
          numberOfItems: items.length,
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout
          title={tPage("title")}
          description={tPage("metaDescription")}
          variant="dashboard"
          showPrivacyBadge
        >
          <div className="premium-tools-page">
            <HomeFeaturedSection
              id="premium-tools"
              title={tPage("title")}
              viewAllHref="/tools/"
              viewAllLabel={tPage("browseAllTools")}
              hideTitle
            >
              {items.map((item) => (
                <HomeFeaturedToolCard
                  key={item.slugHint}
                  href={item.href}
                  label={item.label}
                  slugHint={item.slugHint}
                />
              ))}
            </HomeFeaturedSection>
          </div>
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
