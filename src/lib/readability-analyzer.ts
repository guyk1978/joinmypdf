import {
  estimateReadingTimeMinutes,
  normalizeTextForAnalysis,
  READING_WORDS_PER_MINUTE,
} from "@/lib/word-character-counter";

export { READING_WORDS_PER_MINUTE };

const LONG_SENTENCE_WORD_LIMIT = 20;
const COMPLEX_SYLLABLE_THRESHOLD = 3;

/** Dictionary of difficult words → simpler alternatives (US English). */
export const SIMPLER_SYNONYMS: Record<string, string> = {
  accommodate: "fit",
  accumulate: "gather",
  additional: "extra",
  advantageous: "helpful",
  ameliorate: "improve",
  approximately: "about",
  ascertain: "find out",
  assistance: "help",
  attempting: "trying",
  capable: "able",
  commence: "start",
  comprehend: "understand",
  consequently: "so",
  consolidate: "combine",
  construct: "build",
  contribute: "give",
  currently: "now",
  deficiency: "lack",
  demonstrate: "show",
  designate: "name",
  discontinue: "stop",
  eliminate: "remove",
  embellish: "decorate",
  employment: "job",
  endeavor: "try",
  endeavour: "try",
  establish: "set up",
  establishment: "business",
  evidence: "proof",
  exacerbate: "worsen",
  expend: "spend",
  fabricate: "make",
  facilitate: "help",
  finalize: "finish",
  frequently: "often",
  fundamental: "basic",
  furthermore: "also",
  generate: "create",
  identical: "same",
  immediately: "right away",
  implement: "carry out",
  inactive: "idle",
  incentive: "reward",
  indicate: "show",
  initial: "first",
  initiate: "start",
  inquire: "ask",
  magnitude: "size",
  methodology: "method",
  minimize: "reduce",
  modify: "change",
  necessitate: "need",
  nevertheless: "still",
  nonetheless: "still",
  notify: "tell",
  numerous: "many",
  objective: "goal",
  obtain: "get",
  optimum: "best",
  parameters: "limits",
  participate: "take part",
  permit: "allow",
  portion: "part",
  possess: "have",
  previously: "before",
  prior: "earlier",
  prioritize: "focus on",
  proceed: "go ahead",
  proficiency: "skill",
  provide: "give",
  purchase: "buy",
  purchaser: "buyer",
  receive: "get",
  recommendation: "advice",
  regarding: "about",
  regulations: "rules",
  relinquish: "give up",
  remainder: "rest",
  remuneration: "pay",
  render: "make",
  request: "ask for",
  require: "need",
  requires: "needs",
  residual: "remaining",
  retain: "keep",
  selection: "choice",
  significant: "important",
  strategy: "plan",
  submit: "send in",
  subsequent: "later",
  subsequently: "then",
  substantial: "large",
  sufficient: "enough",
  terminate: "end",
  transform: "change",
  transmit: "send",
  transparent: "clear",
  ultimately: "finally",
  utilize: "use",
  utilise: "use",
  utilization: "use",
  variation: "change",
  vicinity: "area",
};

const ACADEMIC_MARKERS = [
  "furthermore",
  "moreover",
  "therefore",
  "thus",
  "hence",
  "hypothesis",
  "methodology",
  "theoretical",
  "empirical",
  "analysis",
  "framework",
  "discourse",
  "paradigm",
  "consequently",
  "notwithstanding",
  "aforementioned",
  "herein",
  "thereby",
];

const PROFESSIONAL_MARKERS = [
  "regarding",
  "stakeholders",
  "leverage",
  "deliverable",
  "synergy",
  "alignment",
  "objective",
  "please",
  "kindly",
  "respective",
  "pursuant",
  "implementation",
  "bandwidth",
  "actionable",
  "optimize",
  "roadmap",
  "kpi",
  "roi",
];

const CASUAL_MARKERS = [
  "gonna",
  "wanna",
  "kinda",
  "gotta",
  "yeah",
  "yep",
  "cool",
  "awesome",
  "basically",
  "literally",
  "stuff",
  "things",
  "hey",
  "folks",
  "ok",
  "okay",
  "super",
  "pretty",
  "really",
];

export type HighlightKind = "long-sentence" | "complex-word";

export type TextHighlight = {
  start: number;
  end: number;
  kind: HighlightKind;
};

export type LongSentenceHit = {
  text: string;
  wordCount: number;
  start: number;
  end: number;
};

export type ComplexWordHit = {
  word: string;
  syllables: number;
  start: number;
  end: number;
};

export type SimplificationSuggestion = {
  word: string;
  suggestion: string;
  count: number;
};

export type ToneLabel = "professional" | "casual" | "academic" | "neutral";

export type ToneAnalysis = {
  label: ToneLabel;
  /** 0–100 confidence for the winning tone (or balance for neutral). */
  score: number;
  professional: number;
  casual: number;
  academic: number;
};

export type ReadabilityLevel =
  | "veryEasy"
  | "easy"
  | "fairlyEasy"
  | "standard"
  | "fairlyDifficult"
  | "difficult"
  | "veryDifficult";

export type ReadabilityAnalysis = {
  text: string;
  words: number;
  sentences: number;
  syllables: number;
  /** Flesch Reading Ease clamped to 0–100. */
  score: number;
  level: ReadabilityLevel;
  readingTimeMinutes: number;
  wordsPerMinute: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  longSentences: LongSentenceHit[];
  complexWords: ComplexWordHit[];
  suggestions: SimplificationSuggestion[];
  highlights: TextHighlight[];
  tone: ToneAnalysis;
};

export function countSyllables(word: string): number {
  const cleaned = word
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z']/g, "");

  if (!cleaned) return 0;
  if (cleaned.length <= 2) return 1;
  if (cleaned === "the" || cleaned === "a" || cleaned === "i" || cleaned === "to") return 1;

  let w = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  w = w.replace(/^y/, "");
  const groups = w.match(/[aeiouy]{1,2}/g);
  const count = groups ? groups.length : 0;
  return Math.max(1, count);
}

function splitSentencesWithOffsets(text: string): Array<{ text: string; start: number; end: number }> {
  const normalized = normalizeTextForAnalysis(text);
  const results: Array<{ text: string; start: number; end: number }> = [];
  const re = /[^.!?]+[.!?]+|[^.!?]+$/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const lead = raw.length - raw.trimStart().length;
    const start = match.index + lead;
    const end = start + trimmed.length;
    results.push({ text: trimmed, start, end });
  }
  return results;
}

function tokenizeWordsWithOffsets(
  sentence: string,
  sentenceStart: number,
): Array<{ word: string; start: number; end: number }> {
  const results: Array<{ word: string; start: number; end: number }> = [];
  const re = /[\p{L}\p{N}']+/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sentence)) !== null) {
    results.push({
      word: match[0],
      start: sentenceStart + match.index,
      end: sentenceStart + match.index + match[0].length,
    });
  }
  return results;
}

function scoreToLevel(score: number): ReadabilityLevel {
  if (score >= 90) return "veryEasy";
  if (score >= 80) return "easy";
  if (score >= 70) return "fairlyEasy";
  if (score >= 60) return "standard";
  if (score >= 50) return "fairlyDifficult";
  if (score >= 30) return "difficult";
  return "veryDifficult";
}

function fleschReadingEase(words: number, sentences: number, syllables: number): number {
  if (words <= 0 || sentences <= 0) return 0;
  const raw = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

function analyzeTone(words: string[]): ToneAnalysis {
  const lower = words.map((w) => w.toLowerCase());
  const countHits = (markers: string[]) =>
    markers.reduce((sum, marker) => sum + lower.filter((w) => w === marker).length, 0);

  const academic = countHits(ACADEMIC_MARKERS);
  const professional = countHits(PROFESSIONAL_MARKERS);
  const casual = countHits(CASUAL_MARKERS);
  const total = academic + professional + casual;

  if (total === 0) {
    return { label: "neutral", score: 40, professional: 0, casual: 0, academic: 0 };
  }

  const entries: Array<{ label: ToneLabel; value: number }> = [
    { label: "academic", value: academic },
    { label: "professional", value: professional },
    { label: "casual", value: casual },
  ];
  entries.sort((a, b) => b.value - a.value);
  const top = entries[0]!;
  const second = entries[1]!;

  if (top.value === second.value || top.value - second.value < 1) {
    return {
      label: "neutral",
      score: Math.min(100, Math.round((top.value / total) * 100)),
      professional,
      casual,
      academic,
    };
  }

  return {
    label: top.label,
    score: Math.min(100, Math.round((top.value / total) * 100)),
    professional,
    casual,
    academic,
  };
}

function buildSuggestions(complexWords: ComplexWordHit[]): SimplificationSuggestion[] {
  const counts = new Map<string, { suggestion: string; count: number }>();

  for (const hit of complexWords) {
    const key = hit.word.toLowerCase();
    const suggestion = SIMPLER_SYNONYMS[key];
    if (!suggestion) continue;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else counts.set(key, { suggestion, count: 1 });
  }

  return [...counts.entries()]
    .map(([word, meta]) => ({ word, suggestion: meta.suggestion, count: meta.count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, 24);
}

function dedupeComplexWords(hits: ComplexWordHit[]): ComplexWordHit[] {
  const seen = new Set<string>();
  const out: ComplexWordHit[] = [];
  for (const hit of hits) {
    const key = `${hit.start}:${hit.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

/** Analyze readability, complexity, tone, and simplification suggestions (client-side). */
export function analyzeReadability(rawText: string): ReadabilityAnalysis {
  const text = normalizeTextForAnalysis(rawText);
  const sentences = splitSentencesWithOffsets(text);

  const longSentences: LongSentenceHit[] = [];
  const complexWords: ComplexWordHit[] = [];
  const highlights: TextHighlight[] = [];
  const allWords: string[] = [];
  let syllableTotal = 0;

  for (const sentence of sentences) {
    const tokens = tokenizeWordsWithOffsets(sentence.text, sentence.start);
    if (tokens.length === 0) continue;

    for (const token of tokens) {
      allWords.push(token.word);
      const syllables = countSyllables(token.word);
      syllableTotal += syllables;

      const isLatin = /^[A-Za-z']+$/.test(token.word);
      const dictHit = isLatin ? SIMPLER_SYNONYMS[token.word.toLowerCase()] : undefined;
      const isComplex = isLatin && (syllables > COMPLEX_SYLLABLE_THRESHOLD || Boolean(dictHit));

      if (isComplex) {
        complexWords.push({
          word: token.word,
          syllables,
          start: token.start,
          end: token.end,
        });
        highlights.push({ start: token.start, end: token.end, kind: "complex-word" });
      }
    }

    if (tokens.length > LONG_SENTENCE_WORD_LIMIT) {
      longSentences.push({
        text: sentence.text,
        wordCount: tokens.length,
        start: sentence.start,
        end: sentence.end,
      });
      highlights.push({ start: sentence.start, end: sentence.end, kind: "long-sentence" });
    }
  }

  const words = allWords.length;
  const nonEmptySentenceCount = sentences.filter(
    (s) => tokenizeWordsWithOffsets(s.text, s.start).length > 0,
  ).length;
  const sentenceCount = Math.max(1, nonEmptySentenceCount);
  const score = fleschReadingEase(words, sentenceCount, syllableTotal);

  highlights.sort((a, b) => a.start - b.start || b.end - a.end);

  return {
    text,
    words,
    sentences: words === 0 ? 0 : nonEmptySentenceCount,
    syllables: syllableTotal,
    score: words === 0 ? 0 : score,
    level: words === 0 ? "standard" : scoreToLevel(score),
    readingTimeMinutes: estimateReadingTimeMinutes(words),
    wordsPerMinute: READING_WORDS_PER_MINUTE,
    averageWordsPerSentence: words === 0 ? 0 : Math.round((words / sentenceCount) * 10) / 10,
    averageSyllablesPerWord: words === 0 ? 0 : Math.round((syllableTotal / words) * 100) / 100,
    longSentences,
    complexWords: dedupeComplexWords(complexWords),
    suggestions: buildSuggestions(complexWords),
    highlights,
    tone: analyzeTone(allWords),
  };
}

export type HighlightSegment = {
  text: string;
  kind: HighlightKind | null;
};

/** Build alternating plain/highlight segments for overlay rendering. */
export function buildHighlightSegments(text: string, highlights: TextHighlight[]): HighlightSegment[] {
  if (!text) return [];
  if (highlights.length === 0) return [{ text, kind: null }];

  // Word highlights take priority over sentence bands when building ranges
  const marks = [
    ...highlights.filter((h) => h.kind === "long-sentence"),
    ...highlights.filter((h) => h.kind === "complex-word"),
  ].sort((a, b) => a.start - b.start || a.end - b.end);

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const mark of marks) {
    const start = Math.max(cursor, mark.start);
    const end = Math.max(start, Math.min(text.length, mark.end));
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), kind: null });
    }
    if (end > start) {
      segments.push({ text: text.slice(start, end), kind: mark.kind });
      cursor = end;
    }
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), kind: null });
  }

  return segments;
}
