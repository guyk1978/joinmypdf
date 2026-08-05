"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { buildSearchIndex } from "@/lib/search-index";
import { rankSearchResults } from "@/lib/search-results";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import "@/styles/search-results.css";

type ResultsGridProps = {
  query: string;
};

function slugFromPath(path: string): string {
  const cleaned = path.split("?")[0]?.split("#")[0] ?? path;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

export function ResultsGrid({ query }: ResultsGridProps) {
  const locale = useLocale();
  const tHeader = useTranslations("Header");
  const t = useTranslations("SearchPage");
  const tTools = useTranslations("Tools");

  const index = useMemo(
    () => buildSearchIndex(locale, (key) => tHeader(key as "nav.image")),
    [locale, tHeader],
  );

  const trimmedQuery = query.trim();
  const results = useMemo(() => rankSearchResults(index, trimmedQuery), [index, trimmedQuery]);

  const toolResults = useMemo(
    () => results.filter((result) => result.type === "Tool"),
    [results],
  );
  const articleResults = useMemo(
    () => results.filter((result) => result.type === "Article"),
    [results],
  );

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

      {toolResults.length ? (
        <ul className="im-tool-card-grid search-results__tool-grid" role="list">
          {toolResults.map((result) => {
            const slug = resolveCanonicalToolSlug(slugFromPath(result.path));
            const entry = getToolsInventoryEntry(slug);
            const description =
              getToolCardDescription(slug, entry?.description ?? result.description, tTools) ??
              result.description ??
              "";

            return (
              <li key={`tool-${result.path}`} className="im-tool-card-grid__item">
                <IndustrialToolCard
                  href={result.path}
                  label={result.title}
                  description={description}
                  slug={slug}
                  categoryId={entry?.primaryCategory}
                  icon={<ToolListIcon slug={slug} label={result.title} size="sm" />}
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      {articleResults.length ? (
        <ul className="search-results__list search-results__list--articles" role="list">
          {articleResults.map((result) => (
            <li key={`article-${result.path}`} className="search-results__item">
              <Link href={result.path} className="search-results__link" prefetch={false}>
                <span className="search-results__meta">
                  <span className="search-results__tag search-results__tag--article">
                    {tHeader("search.articleTag")}
                  </span>
                  <span className="search-results__title">{result.title}</span>
                </span>
                <span className="search-results__desc">{result.description ?? result.category}</span>
                <span className="search-results__path">{result.path}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
