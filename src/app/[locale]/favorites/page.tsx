import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { FavoritesToolGrid } from "@/components/FavoritesToolGrid";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { routing } from "@/i18n/routing";
import { buildAllHomeToolItems } from "@/lib/featured-tools";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Favorites" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/favorites`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}/favorites`])),
    },
  };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations("Tools");
  const t = await getTranslations("Favorites");
  const toolItems = buildAllHomeToolItems(tTools);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          url: absoluteUrl(`/${locale}/favorites`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("description")} showPrivacyBadge>
          <FavoritesToolGrid items={toolItems} />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
