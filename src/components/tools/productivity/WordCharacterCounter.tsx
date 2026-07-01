"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { analyzeText } from "@/lib/word-character-counter";

export type WordCharacterCounterLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  resetButton: string;
  charactersWithSpacesLabel: string;
  charactersWithoutSpacesLabel: string;
  wordsLabel: string;
  sentencesLabel: string;
  paragraphsLabel: string;
};

type WordCharacterCounterProps = {
  labels: WordCharacterCounterLabels;
  className?: string;
};

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="productivity-counter-tool__stat-card">
      <span className="productivity-counter-tool__stat-value" aria-live="polite">
        {value}
      </span>
      <span className="productivity-counter-tool__stat-label">{label}</span>
    </article>
  );
}

export function WordCharacterCounter({ labels, className }: WordCharacterCounterProps) {
  const inputId = useId();
  const [text, setText] = useState("");

  const stats = useMemo(() => analyzeText(text), [text]);

  return (
    <div className={clsx("productivity-counter-tool", className)}>
      <section className="productivity-tool__pane tool-workspace-panel">
        <div className="productivity-tool__pane-header">
          <label className="productivity-tool__label" htmlFor={inputId}>
            {labels.inputLabel}
          </label>
          <button type="button" className="productivity-tool__reset-btn" onClick={() => setText("")}>
            {labels.resetButton}
          </button>
        </div>
        <textarea
          id={inputId}
          className="productivity-tool__textarea productivity-tool__textarea--large"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={labels.inputPlaceholder}
          dir="auto"
          spellCheck
          rows={14}
        />
      </section>

      <div className="productivity-counter-tool__stats-row">
        <StatCard label={labels.charactersWithSpacesLabel} value={String(stats.charactersWithSpaces)} />
        <StatCard label={labels.charactersWithoutSpacesLabel} value={String(stats.charactersWithoutSpaces)} />
        <StatCard label={labels.wordsLabel} value={String(stats.words)} />
        <StatCard label={labels.sentencesLabel} value={String(stats.sentences)} />
        <StatCard label={labels.paragraphsLabel} value={String(stats.paragraphs)} />
      </div>
    </div>
  );
}
