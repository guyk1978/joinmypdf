import { copyTextToClipboard } from "@/lib/string-generator";

export { copyTextToClipboard };

export type LoremUnit = "paragraphs" | "sentences" | "words";
export type LoremOutputFormat = "plain" | "markdown";

export type LoremGenerateOptions = {
  unit: LoremUnit;
  count: number;
  format: LoremOutputFormat;
  /** Start with the classic “Lorem ipsum dolor sit amet…” opener when generating paragraphs/sentences. */
  startWithLorem?: boolean;
};

export const LOREM_MIN_COUNT = 1;
export const LOREM_MAX_COUNT = 50;
export const LOREM_DEFAULT_COUNT = 3;

/** Classic Lorem Ipsum lexicon (Cicero-derived placeholder vocabulary). */
const LOREM_WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "curabitur",
  "pretium",
  "tincidunt",
  "lacus",
  "aenean",
  "pulvinar",
  "fringilla",
  "mauris",
  "phasellus",
  "viverra",
  "nulla",
  "ut",
  "metus",
  "varius",
  "laoreet",
  "quisque",
  "rutrum",
  "aenean",
  "imperdiet",
  "etiam",
  "ultricies",
  "nisi",
  "vel",
  "augue",
  "curabitur",
  "ullamcorper",
  "ultricies",
  "nisi",
  "nam",
  "eget",
  "dui",
  "etiam",
  "rhoncus",
  "maecenas",
  "tempus",
  "tellus",
  "eget",
  "condimentum",
  "rhoncus",
  "sem",
  "quam",
  "semper",
  "libero",
  "sit",
  "amet",
  "adipiscing",
  "sem",
  "neque",
  "sed",
  "ipsum",
  "nam",
  "quam",
  "nunc",
  "blandit",
  "vel",
  "luctus",
  "pulvinar",
  "hendrerit",
  "id",
  "lorem",
  "maecenas",
  "nec",
  "odio",
  "et",
  "ante",
  "tincidunt",
  "tempus",
  "donec",
  "vitae",
  "sapien",
  "ut",
  "libero",
  "venenatis",
  "faucibus",
  "nullam",
  "quis",
  "ante",
  "etiam",
  "sit",
  "amet",
  "orci",
  "eget",
  "eros",
  "faucibus",
  "tincidunt",
  "duis",
  "leo",
  "sed",
  "fringilla",
  "mauris",
  "sit",
  "amet",
  "nibh",
  "donec",
  "sodales",
  "sagittis",
  "magna",
  "sed",
  "consequat",
  "leo",
  "eget",
  "bibendum",
  "sodales",
  "augue",
  "velit",
  "cursus",
  "nunc",
  "quis",
  "gravida",
  "magna",
  "mi",
  "a",
  "libero",
] as const;

const CLASSIC_OPENER = [
  "Lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
] as const;

function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pickWord(): string {
  return LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)];
}

/**
 * Word-count distribution approximating natural prose:
 * short connectors, medium content words, occasional longer Latin terms.
 */
function wordsPerSentence(): number {
  const roll = Math.random();
  if (roll < 0.15) return randomInt(5, 8);
  if (roll < 0.7) return randomInt(9, 14);
  if (roll < 0.92) return randomInt(15, 20);
  return randomInt(21, 26);
}

function sentencesPerParagraph(): number {
  const roll = Math.random();
  if (roll < 0.2) return randomInt(2, 3);
  if (roll < 0.75) return randomInt(3, 5);
  return randomInt(5, 7);
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildSentenceWords(count: number, forceClassicOpener: boolean): string[] {
  const words: string[] = [];

  if (forceClassicOpener) {
    const opener = CLASSIC_OPENER.slice(0, Math.min(count, CLASSIC_OPENER.length));
    words.push(...opener);
    while (words.length < count) words.push(pickWord());
  } else {
    for (let i = 0; i < count; i++) words.push(pickWord());
  }

  words[0] = capitalize(words[0]);

  // Insert 0–2 commas at natural mid-sentence positions (not adjacent, not near ends).
  if (words.length >= 8) {
    const commaBudget = Math.random() < 0.55 ? 1 : Math.random() < 0.35 ? 2 : 0;
    const used = new Set<number>();
    for (let c = 0; c < commaBudget; c++) {
      const idx = randomInt(2, words.length - 3);
      if (used.has(idx) || used.has(idx - 1) || used.has(idx + 1)) continue;
      used.add(idx);
      words[idx] = `${words[idx]},`;
    }
  }

  return words;
}

export function generateSentence(options?: { classicOpener?: boolean }): string {
  const count = wordsPerSentence();
  const words = buildSentenceWords(count, Boolean(options?.classicOpener));
  return `${words.join(" ").replace(/\s+,/g, ",")}.`;
}

export function generateParagraph(options?: { classicOpener?: boolean }): string {
  const sentenceCount = sentencesPerParagraph();
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(
      generateSentence({
        classicOpener: Boolean(options?.classicOpener) && i === 0,
      }),
    );
  }
  return sentences.join(" ");
}

export function clampLoremCount(count: number): number {
  if (!Number.isFinite(count)) return LOREM_DEFAULT_COUNT;
  return Math.min(LOREM_MAX_COUNT, Math.max(LOREM_MIN_COUNT, Math.round(count)));
}

function generateWords(count: number, startWithLorem: boolean): string {
  const words: string[] = [];
  if (startWithLorem) {
    words.push(...CLASSIC_OPENER.map((w, i) => (i === 0 ? w : w.toLowerCase())));
  }
  while (words.length < count) words.push(pickWord());
  return words.slice(0, count).join(" ");
}

function generateSentences(count: number, startWithLorem: boolean): string[] {
  return Array.from({ length: count }, (_, i) =>
    generateSentence({ classicOpener: startWithLorem && i === 0 }),
  );
}

function generateParagraphs(count: number, startWithLorem: boolean): string[] {
  return Array.from({ length: count }, (_, i) =>
    generateParagraph({ classicOpener: startWithLorem && i === 0 }),
  );
}

export function formatLoremOutput(
  parts: string[],
  unit: LoremUnit,
  format: LoremOutputFormat,
): string {
  if (format === "plain") {
    if (unit === "words") return parts[0] ?? "";
    if (unit === "sentences") return parts.join(" ");
    return parts.join("\n\n");
  }

  // Markdown
  if (unit === "words") {
    const text = parts[0] ?? "";
    return text ? `*${text}*` : "";
  }
  if (unit === "sentences") {
    return parts.map((sentence) => `- ${sentence}`).join("\n");
  }
  return parts.map((paragraph) => paragraph).join("\n\n");
}

export function generateLoremIpsum(options: LoremGenerateOptions): string {
  const count = clampLoremCount(options.count);
  const startWithLorem = options.startWithLorem ?? true;

  if (options.unit === "words") {
    return formatLoremOutput([generateWords(count, startWithLorem)], "words", options.format);
  }
  if (options.unit === "sentences") {
    return formatLoremOutput(generateSentences(count, startWithLorem), "sentences", options.format);
  }
  return formatLoremOutput(generateParagraphs(count, startWithLorem), "paragraphs", options.format);
}

export function isLoremUnit(value: string): value is LoremUnit {
  return value === "paragraphs" || value === "sentences" || value === "words";
}

export function isLoremOutputFormat(value: string): value is LoremOutputFormat {
  return value === "plain" || value === "markdown";
}
