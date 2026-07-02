import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { routing } from "@/i18n/routing";
import { getBrandName } from "@/lib/brand";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}/contact`])),
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `${t("title")} — ${getBrandName(locale)}`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/contact`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("intro")} variant="document">
          <ContactForm />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
