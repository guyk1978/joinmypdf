"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { analyzeReadingText } from "@/lib/reading-time-calculator";

export type ReadingTimeCalculatorLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  resetButton: string;
  resultLabel: string;
  resultValue: string;
  wordsLabel: string;
  emptyHint: string;
};

type ReadingTimeCalculatorProps = {
  labels: ReadingTimeCalculatorLabels;
  className?: string;
};

export function ReadingTimeCalculator({ labels, className }: ReadingTimeCalculatorProps) {
  const inputId = useId();
  const [text, setText] = useState("");

  const result = useMemo(() => analyzeReadingText(text), [text]);

  const resultDisplay =
    result.words > 0
      ? labels.resultValue.replace("{minutes}", String(result.minutes))
      : labels.emptyHint;

  return (
    <div className={clsx("reading-time-tool", className)}>
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

      <section className="productivity-tool__pane tool-workspace-panel reading-time-tool__result-pane">
        <span className="productivity-tool__label">{labels.resultLabel}</span>
        <p className="reading-time-tool__result" aria-live="polite">
          {resultDisplay}
        </p>
        {result.words > 0 ? (
          <p className="reading-time-tool__words">
            {labels.wordsLabel.replace("{count}", String(result.words))}
          </p>
        ) : null}
      </section>
    </div>
  );
}
