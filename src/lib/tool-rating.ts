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

export function getToolRating(slug?: string): ToolRating {
  const seed = hashSlug(slug || "tool");
  return {
    score: 4.7 + (seed % 30) / 100,
    count: 12000 + (seed % 48000),
  };
}
