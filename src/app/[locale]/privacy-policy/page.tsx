import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";

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

const SECTION_KEYS = [
  "overview",
  "informationWeCollect",
  "howWeUse",
  "cookies",
  "dataSecurity",
  "thirdParty",
  "changes",
  "rights",
] as const;

const MAX_SECTION_PARAGRAPHS = 4;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}/privacy-policy`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PrivacyPolicy");

  const sections = SECTION_KEYS.map((key) => {
    const paragraphs: string[] = [];
    for (let i = 1; i <= MAX_SECTION_PARAGRAPHS; i += 1) {
      const paragraphKey = `sections.${key}.p${i}`;
      if (t.has(paragraphKey)) paragraphs.push(t(paragraphKey));
    }
    return {
      id: `privacy-policy-${key}`,
      title: t(`sections.${key}.title`),
      paragraphs,
    };
  });

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
