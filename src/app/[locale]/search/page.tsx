import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { SearchResultsPage } from "@/components/SearchResultsPage";
import { productPageMainClassName } from "@/lib/tool-ui";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "SearchPage" });
  const query = q?.trim();

  return {
    title: query ? t("metaTitleWithQuery", { query }) : t("metaTitle"),
    description: query ? t("metaDescriptionWithQuery", { query }) : t("metaDescription"),
    alternates: { canonical: `/${locale}/search` },
    robots: { index: false, follow: true },
  };
}

function SearchResultsFallback() {
  return (
    <div className="tool-page-layout tool-page-layout--stacked product-page-layout product-page-layout--wide tool-page-layout--magazine">
      <div className="tool-page-layout__content">
        <p className="search-results__empty">…</p>
      </div>
    </div>
  );
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppPageShell mainClassName={productPageMainClassName}>
      <Suspense fallback={<SearchResultsFallback />}>
        <SearchResultsPage />
      </Suspense>
    </AppPageShell>
  );
}
