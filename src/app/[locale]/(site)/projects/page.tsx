import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Projects" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}/projects`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Projects");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("metaTitle"),
          url: absoluteUrl(`/${locale}/projects`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("description")} showPrivacyBadge>
          <ProjectsGrid locale={locale} />
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
