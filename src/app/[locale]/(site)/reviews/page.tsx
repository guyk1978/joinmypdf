import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { AppPageShell } from "@/components/AppPageShell";
import { CommunityReviews } from "@/components/CommunityReviews";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { routing } from "@/i18n/routing";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Reviews" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}/reviews`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}/reviews`])),
    },
  };
}

export default async function ReviewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Reviews");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/reviews`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("description")}>
          <CommunityReviews mode="global" />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
