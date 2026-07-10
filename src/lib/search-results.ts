import type { SearchIndexEntry } from "@/config/tools";
import { scoreSearchEntry } from "@/lib/fuzzy-search";

export type RankedSearchResult = SearchIndexEntry & { score: number };

type RankOptions = {
  limit?: number;
};

/** Rank index entries by title-weighted relevance; drops items below the score threshold. */
export function rankSearchResults(
  index: SearchIndexEntry[],
  rawQuery: string,
  options?: RankOptions,
): RankedSearchResult[] {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const results: RankedSearchResult[] = [];
  for (const entry of index) {
    const score = scoreSearchEntry(entry, query);
    if (score > 0) results.push({ ...entry, score });
  }

  const sorted = results.sort(
    (a, b) => b.score - a.score || (a.type === b.type ? 0 : a.type === "Tool" ? -1 : 1),
  );

  return options?.limit ? sorted.slice(0, options.limit) : sorted;
}
