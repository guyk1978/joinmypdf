"use client";

import { useId, useRef, useState, type CSSProperties, type UIEvent } from "react";
import { clsx } from "clsx";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import {
  analyzeReadability,
  buildHighlightSegments,
  type ReadabilityAnalysis,
  type ReadabilityLevel,
  type ToneLabel,
} from "@/lib/readability-analyzer";

export type ReadabilityAnalyzerLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  analyzeButton: string;
  clearButton: string;
  emptyHint: string;
  errorEmpty: string;
  scoreTitle: string;
  scoreOf: string;
  readingTimeTitle: string;
  readingTimeValue: string;
  complexityTitle: string;
  longSentencesLabel: string;
  complexWordsLabel: string;
  noIssues: string;
  suggestionsTitle: string;
  suggestionArrow: string;
  suggestionCount: string;
  noSuggestions: string;
  toneTitle: string;
  toneProfessional: string;
  toneCasual: string;
  toneAcademic: string;
  toneNeutral: string;
  levelVeryEasy: string;
  levelEasy: string;
  levelFairlyEasy: string;
  levelStandard: string;
  levelFairlyDifficult: string;
  levelDifficult: string;
  levelVeryDifficult: string;
  statsWords: string;
  statsSentences: string;
  statsSyllables: string;
  legendLong: string;
  legendComplex: string;
  privacyLabel: string;
  pageTitle: string;
};

type ReadabilityAnalyzerProps = {
  labels: ReadabilityAnalyzerLabels;
  className?: string;
};

function levelLabel(level: ReadabilityLevel, labels: ReadabilityAnalyzerLabels): string {
  switch (level) {
    case "veryEasy":
      return labels.levelVeryEasy;
    case "easy":
      return labels.levelEasy;
    case "fairlyEasy":
      return labels.levelFairlyEasy;
    case "standard":
      return labels.levelStandard;
    case "fairlyDifficult":
      return labels.levelFairlyDifficult;
    case "difficult":
      return labels.levelDifficult;
    case "veryDifficult":
      return labels.levelVeryDifficult;
  }
}

function toneLabel(tone: ToneLabel, labels: ReadabilityAnalyzerLabels): string {
  switch (tone) {
    case "professional":
      return labels.toneProfessional;
    case "casual":
      return labels.toneCasual;
    case "academic":
      return labels.toneAcademic;
    case "neutral":
      return labels.toneNeutral;
  }
}

function scoreHue(score: number): string {
  // High score = easier = greener
  if (score >= 70) return "#4ade80";
  if (score >= 50) return "#fbbf24";
  return "#f87171";
}

export function ReadabilityAnalyzer({ labels, className }: ReadabilityAnalyzerProps) {
  const inputId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [report, setReport] = useState<ReadabilityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    backdrop.scrollTop = event.currentTarget.scrollTop;
    backdrop.scrollLeft = event.currentTarget.scrollLeft;
  };

  const handleAnalyze = () => {
    if (!input.trim()) {
      setError(labels.errorEmpty);
      setReport(null);
      setCompleted(false);
      return;
    }

    const result = analyzeReadability(input);
    setError(null);
    setReport(result);
    setCompleted(true);
  };

  const handleClear = () => {
    setInput("");
    setReport(null);
    setError(null);
    setCompleted(false);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (report) {
      setReport(null);
      setCompleted(false);
    }
    if (error) setError(null);
  };

  const highlightText = report?.text ?? input;
  const segments = report
    ? buildHighlightSegments(highlightText, report.highlights)
    : [{ text: highlightText, kind: null }];

  return (
    <div className={clsx("readability-analyzer", className)}>
      <div className="readability-analyzer__layout">
        <div className="readability-analyzer__input-pane tool-workspace-panel security-tool__pane">
          <label htmlFor={inputId} className="security-tool__section-title">
            {labels.inputLabel}
          </label>

          <div className={clsx("readability-analyzer__editor", report && "readability-analyzer__editor--live")}>
            <div
              ref={backdropRef}
              className="readability-analyzer__backdrop"
              aria-hidden="true"
            >
              {segments.map((segment, index) =>
                segment.kind ? (
                  <mark
                    key={`${segment.kind}-${index}`}
                    className={clsx(
                      "readability-analyzer__mark",
                      segment.kind === "long-sentence" && "readability-analyzer__mark--long",
                      segment.kind === "complex-word" && "readability-analyzer__mark--complex",
                    )}
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={`plain-${index}`}>{segment.text}</span>
                ),
              )}
              {highlightText.endsWith("\n") ? "\n" : null}
            </div>
            <textarea
              id={inputId}
              className="security-tool__textarea readability-analyzer__textarea"
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              onScroll={syncScroll}
              placeholder={labels.inputPlaceholder}
              spellCheck
              rows={16}
            />
          </div>

          <div className="readability-analyzer__legend" aria-hidden={report === null}>
            <span className="readability-analyzer__legend-item readability-analyzer__legend-item--long">
              {labels.legendLong}
            </span>
            <span className="readability-analyzer__legend-item readability-analyzer__legend-item--complex">
              {labels.legendComplex}
            </span>
          </div>

          <div className="readability-analyzer__actions">
            <button type="button" className="security-tool__primary-btn" onClick={handleAnalyze}>
              {labels.analyzeButton}
            </button>
            <button type="button" className="security-tool__ghost-btn" onClick={handleClear}>
              {labels.clearButton}
            </button>
          </div>

          {error ? (
            <p className="security-tool__error" role="alert">
              {error}
            </p>
          ) : null}

          <p className="readability-analyzer__privacy">{labels.privacyLabel}</p>
        </div>

        <aside className="readability-analyzer__dashboard tool-workspace-panel security-tool__pane">
          {!report ? (
            <p className="readability-analyzer__empty">{labels.emptyHint}</p>
          ) : (
            <>
              <section className="readability-analyzer__score-card" aria-labelledby="readability-score-title">
                <div className="readability-analyzer__score-head">
                  <h2 id="readability-score-title" className="security-tool__section-title">
                    {labels.scoreTitle}
                  </h2>
                  <p className="readability-analyzer__level">{levelLabel(report.level, labels)}</p>
                </div>
                <div
                  className="readability-analyzer__score-ring"
                  style={
                    {
                      ["--score-hue" as string]: scoreHue(report.score),
                      ["--score-pct" as string]: `${Math.max(0, Math.min(100, report.score))}%`,
                    } as CSSProperties
                  }
                  role="img"
                  aria-label={`${report.score} ${labels.scoreOf}`}
                >
                  <span className="readability-analyzer__score-value">{report.score}</span>
                  <span className="readability-analyzer__score-scale">{labels.scoreOf}</span>
                </div>
                <ul className="readability-analyzer__stats">
                  <li>{labels.statsWords.replace("{count}", String(report.words))}</li>
                  <li>{labels.statsSentences.replace("{count}", String(report.sentences))}</li>
                  <li>{labels.statsSyllables.replace("{count}", String(report.syllables))}</li>
                </ul>
              </section>

              <section className="readability-analyzer__metric" aria-labelledby="readability-time-title">
                <h2 id="readability-time-title" className="security-tool__section-title">
                  {labels.readingTimeTitle}
                </h2>
                <p className="readability-analyzer__metric-value">
                  {labels.readingTimeValue.replace("{minutes}", String(report.readingTimeMinutes))}
                </p>
              </section>

              <section className="readability-analyzer__tone" aria-labelledby="readability-tone-title">
                <h2 id="readability-tone-title" className="security-tool__section-title">
                  {labels.toneTitle}
                </h2>
                <div className="readability-analyzer__tone-gauge" data-tone={report.tone.label}>
                  <div className="readability-analyzer__tone-track" aria-hidden="true">
                    <span
                      className="readability-analyzer__tone-needle"
                      style={{
                        left: `${
                          report.tone.label === "casual"
                            ? 12
                            : report.tone.label === "professional"
                              ? 50
                              : report.tone.label === "academic"
                                ? 88
                                : 50
                        }%`,
                      }}
                    />
                  </div>
                  <p className="readability-analyzer__tone-label">
                    {toneLabel(report.tone.label, labels)}
                  </p>
                  <div className="readability-analyzer__tone-scale" aria-hidden="true">
                    <span>{labels.toneCasual}</span>
                    <span>{labels.toneProfessional}</span>
                    <span>{labels.toneAcademic}</span>
                  </div>
                </div>
              </section>

              <section className="readability-analyzer__complexity" aria-labelledby="readability-complexity-title">
                <h2 id="readability-complexity-title" className="security-tool__section-title">
                  {labels.complexityTitle}
                </h2>
                <ul className="readability-analyzer__issue-list">
                  <li>
                    {labels.longSentencesLabel.replace("{count}", String(report.longSentences.length))}
                  </li>
                  <li>
                    {labels.complexWordsLabel.replace("{count}", String(report.complexWords.length))}
                  </li>
                </ul>
                {report.longSentences.length === 0 && report.complexWords.length === 0 ? (
                  <p className="readability-analyzer__muted">{labels.noIssues}</p>
                ) : (
                  <ul className="readability-analyzer__long-list">
                    {report.longSentences.slice(0, 5).map((hit) => (
                      <li key={`${hit.start}-${hit.end}`}>
                        <span className="readability-analyzer__chip">{hit.wordCount}w</span>
                        <span className="readability-analyzer__snippet">
                          {hit.text.length > 120 ? `${hit.text.slice(0, 117)}…` : hit.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="readability-analyzer__suggestions" aria-labelledby="readability-suggestions-title">
                <h2 id="readability-suggestions-title" className="security-tool__section-title">
                  {labels.suggestionsTitle}
                </h2>
                {report.suggestions.length === 0 ? (
                  <p className="readability-analyzer__muted">{labels.noSuggestions}</p>
                ) : (
                  <ul className="readability-analyzer__suggestion-list">
                    {report.suggestions.map((item) => (
                      <li key={item.word}>
                        <span className="readability-analyzer__hard">{item.word}</span>
                        <span className="readability-analyzer__arrow" aria-hidden="true">
                          {labels.suggestionArrow}
                        </span>
                        <span className="readability-analyzer__easy">{item.suggestion}</span>
                        {item.count > 1 ? (
                          <span className="readability-analyzer__count">
                            {labels.suggestionCount.replace("{count}", String(item.count))}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </aside>
      </div>

      {completed ? (
        <ToolSuccessEngagement
          pageTitle={labels.pageTitle}
          className="readability-analyzer__engagement"
        />
      ) : null}
    </div>
  );
}
