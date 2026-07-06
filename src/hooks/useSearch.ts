"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SearchIndexEntry } from "@/config/tools";
import { scoreSearchEntry } from "@/lib/fuzzy-search";
import { buildSearchIndex } from "@/lib/search-index";

const RESULT_LIMIT = 8;

export type ScoredSearchResult = SearchIndexEntry & { score: number };

export type GroupedSearchResults = {
  tools: ScoredSearchResult[];
  articles: ScoredSearchResult[];
  flat: ScoredSearchResult[];
  hasQuery: boolean;
};

function rankEntries(index: SearchIndexEntry[], query: string, type: SearchIndexEntry["type"]): ScoredSearchResult[] {
  return index
    .filter((entry) => entry.type === type)
    .map((entry) => ({ ...entry, score: scoreSearchEntry(entry, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, RESULT_LIMIT);
}

export function useSearch(query: string): GroupedSearchResults {
  const locale = useLocale();
  const t = useTranslations("Header");

  const index = useMemo(() => buildSearchIndex(locale, (key) => t(key as "nav.image")), [locale, t]);

  return useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { tools: [], articles: [], flat: [], hasQuery: false };
    }

    const tools = rankEntries(index, trimmed, "Tool");
    const articles = rankEntries(index, trimmed, "Article");
    const flat = [...tools, ...articles];

    return { tools, articles, flat, hasQuery: true };
  }, [index, query]);
}
