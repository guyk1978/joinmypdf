"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { ResultsGrid } from "@/components/ResultsGrid";

export function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const t = useTranslations("SearchPage");

  const trimmedQuery = query.trim();
  const title = trimmedQuery ? t("titleWithQuery", { query: trimmedQuery }) : t("titleDefault");

  useEffect(() => {
    document.title = trimmedQuery
      ? `${t("metaTitleWithQuery", { query: trimmedQuery })} | JoinMyPDF`
      : `${t("metaTitle")} | JoinMyPDF`;
  }, [t, trimmedQuery]);

  return (
    <ProductPageLayout title={title}>
      <ResultsGrid query={query} />
    </ProductPageLayout>
  );
}
