import type { Metadata } from "next";

export const runtime = "edge";

import { AppPageShell } from "@/components/AppPageShell";
import { InfoProseDocument } from "@/components/InfoProseDocument";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const SECTION_KEYS = ["overview", "files", "analytics", "rights"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/privacy-policy` },
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PrivacyPolicy");

  const sections = SECTION_KEYS.map((key) => ({
    id: `privacy-policy-${key}`,
    title: t(`sections.${key}.title`),
    paragraphs: [t(`sections.${key}.p1`), t(`sections.${key}.p2`)],
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/privacy-policy`),
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
