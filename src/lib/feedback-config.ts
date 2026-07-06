export const FEEDBACK_TYPES = ["happy", "bug", "suggestion"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_REASONS: Record<FeedbackType, readonly string[]> = {
  happy: ["workedAsExpected", "fastProcessing", "easyToUse", "greatQuality"],
  bug: ["conversionFailed", "slowProcessing", "uploadFailed", "wrongOutput", "pageError", "otherBug"],
  suggestion: ["newFeature", "betterQuality", "moreFormats", "uiImprovement", "documentation", "otherSuggestion"],
};
