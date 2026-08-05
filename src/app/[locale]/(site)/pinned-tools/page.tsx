import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { AppPageShell } from "@/components/AppPageShell";
import { PinnedToolsGrid } from "@/components/PinnedToolsGrid";
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
  const t = await getTranslations({ locale, namespace: "PinnedTools" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}/pinned-tools`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/pinned-tools`]),
      ),
    },
  };
}

export default async function PinnedToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTools = await getTranslations("Tools");
  const t = await getTranslations("PinnedTools");
  const toolItems = buildAllHomeToolItems(tTools);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          url: absoluteUrl(`/${locale}/pinned-tools`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("description")} showPrivacyBadge>
          <PinnedToolsGrid items={toolItems} />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
