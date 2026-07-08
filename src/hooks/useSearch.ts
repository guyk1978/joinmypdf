"use client";

import Fuse from "fuse.js";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SearchIndexEntry } from "@/config/tools";
import { buildSearchIndex } from "@/lib/search-index";

const RESULT_LIMIT = 8;
const FORMAT_PRIORITY_TERMS = new Set([
  "pdf",
  "mp3",
  "wav",
  "aac",
  "flac",
  "m4a",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "gif",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "svg",
  "ico",
  "csv",
  "json",
  "yaml",
  "sql",
  "txt",
  "html",
  "markdown",
]);

export type ScoredSearchResult = SearchIndexEntry & { score: number };

export type GroupedSearchResults = {
  tools: ScoredSearchResult[];
  articles: ScoredSearchResult[];
  flat: ScoredSearchResult[];
  hasQuery: boolean;
};

function applyPriorityBoost(entry: SearchIndexEntry, query: string, baseScore: number): number {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  let boost = entry.type === "Tool" ? 40 : 0;
  const haystack = [entry.title, entry.category, entry.keywords, ...(entry.tags ?? []), ...(entry.priorityHints ?? [])]
    .join(" ")
    .toLowerCase();

  for (const token of tokens) {
    if (FORMAT_PRIORITY_TERMS.has(token) && haystack.includes(token)) {
      boost += entry.type === "Tool" ? 90 : 20;
    }
  }

  if (entry.type === "Tool" && entry.title.toLowerCase().includes(query.toLowerCase())) {
    boost += 35;
  }
  return baseScore + boost;
}

function rankEntries(index: SearchIndexEntry[], query: string): ScoredSearchResult[] {
  const fuse = new Fuse(index, {
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 0.45 },
      { name: "keywords", weight: 0.3 },
      { name: "tags", weight: 0.15 },
      { name: "category", weight: 0.1 },
    ],
  });

  return fuse
    .search(query, { limit: RESULT_LIMIT * 4 })
    .map(({ item, score = 1 }) => {
      const base = Math.round((1 - score) * 1000);
      return { ...item, score: applyPriorityBoost(item, query, base) };
    })
    .sort((a, b) => b.score - a.score || (a.type === b.type ? 0 : a.type === "Tool" ? -1 : 1))
    .slice(0, RESULT_LIMIT * 2);
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

    const ranked = rankEntries(index, trimmed);
    const tools = ranked.filter((entry) => entry.type === "Tool").slice(0, RESULT_LIMIT);
    const articles = ranked.filter((entry) => entry.type === "Article").slice(0, RESULT_LIMIT);
    const flat = [...tools, ...articles];

    return { tools, articles, flat, hasQuery: true };
  }, [index, query]);
}
