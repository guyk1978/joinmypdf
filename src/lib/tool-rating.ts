/**
 * Deterministic seed ratings + per-tool-id user votes (localStorage).
 * Votes are keyed by the canonical tool slug so ratings never bleed between
 * similarly named tools (e.g. video-trimmer vs video-speed).
 */

/** Single map of `{ [toolSlug]: 1–5 }` — unique Tool ID per entry. */
export const TOOL_RATINGS_STORAGE_KEY = "joinmypdf_tool_ratings_user";
export const TOOL_RATINGS_CHANGED_EVENT = "joinmypdf:tool-ratings-changed";

/** Legacy per-tool keys from ToolModalRating — migrated on first read. */
const LEGACY_STORAGE_PREFIX = "jmp-tool-rating:";

const MIN_RATING = 1;
const MAX_RATING = 5;

/** Deterministic 32-bit FNV-1a hash so each tool shows a stable score/count. */
function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type ToolRating = {
  /** 4.70–4.99, stable per slug */
  score: number;
  /** 12,000–59,999, stable per slug */
  count: number;
};

export type ToolRatingAggregate = {
  sum: number;
  count: number;
};

export type ToolRatingStats = ToolRatingAggregate & {
  average: number | null;
};

export type ToolUserRatingsMap = Record<string, number>;

export function getToolRating(slug?: string): ToolRating {
  const seed = hashSlug(slug || "tool");
  return {
    score: 4.7 + (seed % 30) / 100,
    count: 12000 + (seed % 48000),
  };
}

/** Seed aggregate from the deterministic catalog score. */
export function getToolRatingAggregate(slug: string): ToolRatingAggregate {
  const { score, count } = getToolRating(slug);
  return {
    sum: Math.round(score * count * 100) / 100,
    count,
  };
}

export function computeAverage(aggregate: ToolRatingAggregate): number | null {
  if (aggregate.count <= 0) return null;
  return aggregate.sum / aggregate.count;
}

export function toStats(aggregate: ToolRatingAggregate): ToolRatingStats {
  return { ...aggregate, average: computeAverage(aggregate) };
}

/** Fold a once-only user vote into the seeded catalog aggregate. */
export function mergeUserVoteIntoAggregate(
  remote: ToolRatingAggregate,
  userRating: number | null,
): ToolRatingStats {
  if (userRating === null) return toStats(remote);
  return toStats({
    sum: remote.sum + userRating,
    count: remote.count + 1,
  });
}

export function formatRatingAverage(average: number | null): string {
  if (average === null) return "—";
  return average.toFixed(1);
}

/** Compact count label — `12.4k ratings` once count ≥ 1,000. */
export function formatRatingCount(count: number): string {
  if (count === 0) return "No ratings yet";
  if (count === 1) return "1 rating";
  if (count >= 1000) {
    const compact =
      count >= 10000
        ? Math.round(count / 1000).toString()
        : (count / 1000).toFixed(1).replace(/\.0$/, "");
    return `${compact}k ratings`;
  }
  return `${count} ratings`;
}

function sanitizeUserVotes(raw: unknown): ToolUserRatingsMap {
  if (!raw || typeof raw !== "object") return {};
  const result: ToolUserRatingsMap = {};

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || typeof id !== "string") continue;
    if (typeof value !== "number" || !Number.isInteger(value)) continue;
    if (value < MIN_RATING || value > MAX_RATING) continue;
    result[id] = value;
  }

  return result;
}

function migrateLegacyVote(toolId: string, into: ToolUserRatingsMap): void {
  if (into[toolId] != null) return;
  try {
    const legacy = window.localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${toolId}`);
    if (!legacy) return;
    const value = Number(legacy);
    if (!Number.isInteger(value) || value < MIN_RATING || value > MAX_RATING) return;
    into[toolId] = value;
    window.localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${toolId}`);
  } catch {
    // Ignore migration failures.
  }
}

export function readUserToolRatings(): ToolUserRatingsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TOOL_RATINGS_STORAGE_KEY);
    return sanitizeUserVotes(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

/** Read the once-only vote for a specific tool ID (canonical slug). */
export function readUserToolRating(toolId: string): number | null {
  if (!toolId) return null;
  const votes = readUserToolRatings();
  if (votes[toolId] != null) return votes[toolId];

  migrateLegacyVote(toolId, votes);
  if (votes[toolId] != null) {
    writeUserToolRatings(votes);
    return votes[toolId];
  }
  return null;
}

function writeUserToolRatings(votes: ToolUserRatingsMap): void {
  window.localStorage.setItem(TOOL_RATINGS_STORAGE_KEY, JSON.stringify(votes));
  window.dispatchEvent(new Event(TOOL_RATINGS_CHANGED_EVENT));
}

/**
 * Persist a 1–5 rating for `toolId`. No-ops if this tool was already rated —
 * one vote per unique Tool ID.
 */
export function setUserToolRating(toolId: string, rating: number): ToolUserRatingsMap {
  if (!toolId) return readUserToolRatings();
  if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    return readUserToolRatings();
  }

  const current = readUserToolRatings();
  migrateLegacyVote(toolId, current);
  if (current[toolId] != null) return current;

  const next = { ...current, [toolId]: rating };
  writeUserToolRatings(next);
  return next;
}
