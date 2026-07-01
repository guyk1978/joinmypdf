import { analyzeText, estimateReadingTimeMinutes, countWords, READING_WORDS_PER_MINUTE } from "@/lib/word-character-counter";

export { READING_WORDS_PER_MINUTE };

export type ReadingTimeResult = {
  words: number;
  minutes: number;
};

export function calculateReadingTime(text: string, wordsPerMinute = READING_WORDS_PER_MINUTE): ReadingTimeResult {
  const words = countWords(text);
  return {
    words,
    minutes: estimateReadingTimeMinutes(words, wordsPerMinute),
  };
}

export function analyzeReadingText(text: string): ReadingTimeResult {
  const stats = analyzeText(text);
  return {
    words: stats.words,
    minutes: stats.readingTimeMinutes,
  };
}
