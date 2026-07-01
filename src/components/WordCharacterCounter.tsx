"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { analyzeText } from "@/lib/word-character-counter";

export type WordCharacterCounterLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  statsTitle: string;
  charactersWithSpacesLabel: string;
  charactersWithoutSpacesLabel: string;
  wordsLabel: string;
  paragraphsLabel: string;
  readingTimeLabel: string;
  readingTimeValue: string;
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
    <article className="text-counter-tool__stat-card">
      <span className="text-counter-tool__stat-value" aria-live="polite">
        {value}
      </span>
      <span className="text-counter-tool__stat-label">{label}</span>
    </article>
  );
}

export function WordCharacterCounter({ labels, className }: WordCharacterCounterProps) {
  const inputId = useId();
  const [text, setText] = useState("");

  const stats = useMemo(() => analyzeText(text), [text]);

  const readingTimeDisplay = labels.readingTimeValue.replace(
    "{minutes}",
    String(stats.readingTimeMinutes),
  );

  return (
    <div className={clsx("text-counter-tool", className)}>
      <div className="text-counter-tool__input tool-workspace-panel">
        <label className="text-counter-tool__label" htmlFor={inputId}>
          {labels.inputLabel}
        </label>
        <textarea
          id={inputId}
          className="text-counter-tool__textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={labels.inputPlaceholder}
          dir="auto"
          spellCheck
          rows={16}
        />
      </div>

      <aside className="text-counter-tool__stats tool-workspace-panel" aria-label={labels.statsTitle}>
        <h2 className="text-counter-tool__stats-title">{labels.statsTitle}</h2>
        <div className="text-counter-tool__stat-grid">
          <StatCard label={labels.charactersWithSpacesLabel} value={String(stats.charactersWithSpaces)} />
          <StatCard
            label={labels.charactersWithoutSpacesLabel}
            value={String(stats.charactersWithoutSpaces)}
          />
          <StatCard label={labels.wordsLabel} value={String(stats.words)} />
          <StatCard label={labels.paragraphsLabel} value={String(stats.paragraphs)} />
          <StatCard label={labels.readingTimeLabel} value={readingTimeDisplay} />
        </div>
      </aside>
    </div>
  );
}
