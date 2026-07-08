import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryShell } from "@/components/CategoryDirectoryShell";
import { getCategoryDirectoryItemCount, getCategoryDirectoryPageProps } from "@/lib/category-directory-config";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("textJsonToolsDirectoryTitle"),
    description: t("textJsonToolsDirectoryDescription"),
    alternates: { canonical: `/${locale}/text-json-tools` },
  };
}

export default async function TextJsonToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHome = await getTranslations("Home");
  const tCategory = await getTranslations("CategoryDirectory");
  const page = getCategoryDirectoryPageProps("text-json", tHome, tCategory);
  const itemCount = getCategoryDirectoryItemCount("text-json", tHome);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: page.title,
          description: page.description,
          url: absoluteUrl(`/${locale}/text-json-tools`),
          numberOfItems: itemCount,
        }}
      />
      <AppPageShell>
        <CategoryDirectoryShell {...page} />
      </AppPageShell>
    </>
  );
}
