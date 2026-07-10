"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SearchIndexEntry } from "@/config/tools";
import { buildSearchIndex } from "@/lib/search-index";
import { rankSearchResults, type RankedSearchResult } from "@/lib/search-results";

const RESULT_LIMIT = 8;

export type ScoredSearchResult = RankedSearchResult;

export type GroupedSearchResults = {
  tools: ScoredSearchResult[];
  articles: ScoredSearchResult[];
  flat: ScoredSearchResult[];
  hasQuery: boolean;
};

export function useSearch(query: string): GroupedSearchResults {
  const locale = useLocale();
  const t = useTranslations("Header");

  const index = useMemo(() => buildSearchIndex(locale, (key) => t(key as "nav.image")), [locale, t]);

  return useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { tools: [], articles: [], flat: [], hasQuery: false };
    }

    const ranked = rankSearchResults(index, trimmed, { limit: RESULT_LIMIT * 2 });
    const tools = ranked.filter((entry) => entry.type === "Tool").slice(0, RESULT_LIMIT);
    const articles = ranked.filter((entry) => entry.type === "Article").slice(0, RESULT_LIMIT);
    const flat = [...tools, ...articles];

    return { tools, articles, flat, hasQuery: true };
  }, [index, query]);
}
