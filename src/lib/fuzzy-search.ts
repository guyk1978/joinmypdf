import type { SearchIndexEntry } from "@/config/tools";

/** Title / H1 matches are weighted higher than meta-description matches. */
export const SEARCH_TITLE_WEIGHT = 10;
export const SEARCH_META_WEIGHT = 1;
/** Results at or below this score are discarded as low-relevance noise. */
export const SEARCH_MIN_SCORE = 1;

function fuzzySubsequence(needle: string, haystack: string): boolean {
  if (!needle) return true;
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return index === needle.length;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length];
}

function fuzzyTokenMatch(token: string, haystack: string): boolean {
  if (!token) return true;
  if (haystack.includes(token)) return true;
  if (fuzzySubsequence(token, haystack)) return true;

  const maxDistance = token.length <= 4 ? 1 : 2;
  for (const word of haystack.split(/\s+/)) {
    if (word.length < 2) continue;
    if (levenshtein(token, word) <= maxDistance) return true;
  }
  return false;
}

function normalizeQuery(rawQuery: string): string {
  return rawQuery.trim().toLowerCase();
}

function tokenize(query: string): string[] {
  return query.split(/\s+/).filter(Boolean);
}

/** Base relevance for a single searchable field (before title/meta weighting). */
function scoreTextMatch(text: string, query: string, tokens: string[]): number {
  const lower = text.toLowerCase().trim();
  if (!lower) return 0;

  if (lower === query) return 100;
  if (lower.startsWith(query)) return 90;
  if (lower.includes(query)) return 80;
  if (fuzzySubsequence(query, lower)) return 65;

  if (tokens.length > 1 && tokens.every((token) => fuzzyTokenMatch(token, lower))) {
    return 55;
  }

  if (tokens.length === 1 && fuzzyTokenMatch(tokens[0], lower)) {
    return 50;
  }

  return 0;
}

/** Title (primary H1) must contain the query phrase or every token as a real substring. */
function titleMatchesQuery(title: string, query: string, tokens: string[]): boolean {
  const lower = title.toLowerCase();
  if (query.length >= 2 && lower.includes(query)) return true;
  return tokens.every((token) => token.length >= 2 && lower.includes(token));
}

function metaSearchText(entry: SearchIndexEntry): string {
  return [entry.description, entry.metaKeywords].filter(Boolean).join(" ");
}

/**
 * Score a search index entry using title-weighted relevance.
 * Returns -1 when the item should not appear in results.
 */
export function scoreSearchEntry(entry: SearchIndexEntry, rawQuery: string): number {
  const query = normalizeQuery(rawQuery);
  if (query.length < 2) return -1;

  const tokens = tokenize(query);

  if (!titleMatchesQuery(entry.title, query, tokens)) {
    return -1;
  }

  const titleBase = scoreTextMatch(entry.title, query, tokens);
  const metaBase = scoreTextMatch(metaSearchText(entry), query, tokens);
  const score = titleBase * SEARCH_TITLE_WEIGHT + metaBase * SEARCH_META_WEIGHT;

  return score > SEARCH_MIN_SCORE ? score : -1;
}
