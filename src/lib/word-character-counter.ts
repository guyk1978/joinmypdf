export const READING_WORDS_PER_MINUTE = 200;

/** Strip invisible bidi control characters used in RTL/LTR mixed text. */
const BIDI_CONTROL_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/** Unicode-aware whitespace (spaces, tabs, newlines, NBSP, etc.). */
const WHITESPACE_RE = /\s/gu;

export type TextAnalysisStats = {
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  words: number;
  paragraphs: number;
  readingTimeMinutes: number;
};

export function normalizeTextForAnalysis(text: string): string {
  return text.replace(BIDI_CONTROL_RE, "");
}

export function countCharactersWithSpaces(text: string): number {
  return [...normalizeTextForAnalysis(text)].length;
}

export function countCharactersWithoutSpaces(text: string): number {
  return normalizeTextForAnalysis(text).replace(WHITESPACE_RE, "").length;
}

export function countWords(text: string): number {
  const normalized = normalizeTextForAnalysis(text).trim();
  if (!normalized) return 0;

  return normalized.split(/\s+/u).filter((segment) => segment.length > 0).length;
}

export function countParagraphs(text: string): number {
  const normalized = normalizeTextForAnalysis(text).trim();
  if (!normalized) return 0;

  return normalized
    .split(/\n\s*\n/u)
    .map((block) => block.trim())
    .filter((block) => block.length > 0).length;
}

export function estimateReadingTimeMinutes(wordCount: number, wordsPerMinute = READING_WORDS_PER_MINUTE): number {
  if (wordCount <= 0) return 0;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function analyzeText(text: string): TextAnalysisStats {
  const words = countWords(text);

  return {
    charactersWithSpaces: countCharactersWithSpaces(text),
    charactersWithoutSpaces: countCharactersWithoutSpaces(text),
    words,
    paragraphs: countParagraphs(text),
    readingTimeMinutes: estimateReadingTimeMinutes(words),
  };
}
