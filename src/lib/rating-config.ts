export const IMPACT_SCORE_KEYS = [
  "savedTime",
  "solvedProblem",
  "superFast",
  "easyToUse",
] as const;

export type ImpactScoreKey = (typeof IMPACT_SCORE_KEYS)[number];
