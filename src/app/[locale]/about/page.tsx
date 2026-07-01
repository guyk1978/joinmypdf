import type { Metadata } from "next";

export const runtime = "edge";

import { AppPageShell } from "@/components/AppPageShell";
import { InfoProseDocument } from "@/components/InfoProseDocument";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { getBrandName } from "@/lib/brand";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const SECTION_KEYS = ["mission", "approach", "contact"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/about` },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  const sections = SECTION_KEYS.map((key) => ({
    id: `about-${key}`,
    title: t(`sections.${key}.title`),
    paragraphs: [t(`sections.${key}.p1`), t.has(`sections.${key}.p2`) ? t(`sections.${key}.p2`) : ""].filter(
      Boolean,
    ),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `${t("title")} — ${getBrandName(locale)}`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/about`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("description")} variant="document">
          <InfoProseDocument sections={sections} />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
