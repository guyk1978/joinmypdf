import type { SearchIndexEntry } from "@/config/tools";
import { scoreSearchEntry } from "@/lib/fuzzy-search";

export type RankedSearchResult = SearchIndexEntry & { score: number };

/** Rank all index entries by relevance (title matches score higher than description-only matches). */
export function rankSearchResults(index: SearchIndexEntry[], rawQuery: string): RankedSearchResult[] {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const results: RankedSearchResult[] = [];
  for (const entry of index) {
    const score = scoreSearchEntry(entry, query);
    if (score >= 0) results.push({ ...entry, score });
  }

  return results.sort(
    (a, b) => b.score - a.score || (a.type === b.type ? 0 : a.type === "Tool" ? -1 : 1),
  );
}
