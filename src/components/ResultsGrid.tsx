"use client";

import { clsx } from "clsx";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildSearchIndex } from "@/lib/search-index";
import { rankSearchResults } from "@/lib/search-results";
import "@/styles/search-results.css";

type ResultsGridProps = {
  query: string;
};

export function ResultsGrid({ query }: ResultsGridProps) {
  const locale = useLocale();
  const tHeader = useTranslations("Header");
  const t = useTranslations("SearchPage");

  const index = useMemo(
    () => buildSearchIndex(locale, (key) => tHeader(key as "nav.image")),
    [locale, tHeader],
  );

  const trimmedQuery = query.trim();
  const results = useMemo(() => rankSearchResults(index, trimmedQuery), [index, trimmedQuery]);

  if (!trimmedQuery) {
    return <p className="search-results__empty">{t("noQuery")}</p>;
  }

  if (!results.length) {
    return (
      <div className="search-results__empty-state">
        <p className="search-results__empty">{t("noResults")}</p>
        <Link href="/tools/" className="search-results__empty-link" prefetch={false}>
          {t("browseAllTools")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="search-results__count">{t("resultCount", { count: results.length })}</p>
      <ul className="search-results__list" role="list">
        {results.map((result) => (
          <li key={`${result.type}-${result.path}`} className="search-results__item">
            <Link href={result.path} className="search-results__link" prefetch={false}>
              <span className="search-results__meta">
                <span
                  className={clsx(
                    "search-results__tag",
                    result.type === "Tool" ? "search-results__tag--tool" : "search-results__tag--article",
                  )}
                >
                  {result.type === "Tool" ? tHeader("search.toolTag") : tHeader("search.articleTag")}
                </span>
                <span className="search-results__title">{result.title}</span>
              </span>
              <span className="search-results__desc">{result.description ?? result.category}</span>
              <span className="search-results__path">{result.path}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
