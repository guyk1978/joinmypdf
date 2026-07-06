import type { SearchIndexEntry } from "@/config/tools";

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

/** Score a search index entry; returns -1 when it should not match. */
export function scoreSearchEntry(entry: SearchIndexEntry, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return -1;

  const title = entry.title.toLowerCase();
  const haystack = [entry.title, entry.category, entry.keywords, entry.description ?? ""]
    .join(" ")
    .toLowerCase();

  if (title === query) return 120;
  if (title.startsWith(query)) return 100;
  if (title.includes(query)) return 85;
  if (fuzzySubsequence(query, title)) return 75;

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => fuzzyTokenMatch(token, haystack))) return 70;

  if (haystack.includes(query)) return 65;
  if (tokens.every((token) => fuzzyTokenMatch(token, haystack))) return 55;

  return -1;
}
