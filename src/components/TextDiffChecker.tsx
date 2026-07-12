"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { compareTextDiff, type SideBySideDiffRow } from "@/lib/text-diff";

export type TextDiffCheckerLabels = {
  originalLabel: string;
  originalPlaceholder: string;
  changedLabel: string;
  changedPlaceholder: string;
  compareButton: string;
  swapButton: string;
  clearButton: string;
  resultOriginalLabel: string;
  resultChangedLabel: string;
  emptyDiff: string;
  emptyHint: string;
  statsLabel: string;
  privacyLabel: string;
};

type TextDiffCheckerProps = {
  labels: TextDiffCheckerLabels;
  className?: string;
};

function DiffLineCell({ line }: { line: { kind: string; text: string } | null }) {
  if (!line) {
    return <span className="text-diff-tool__line text-diff-tool__line--empty">&nbsp;</span>;
  }

  return (
    <span
      className={clsx(
        "text-diff-tool__line",
        line.kind === "added" && "text-diff-tool__line--added",
        line.kind === "removed" && "text-diff-tool__line--removed",
      )}
    >
      {line.text || "\u00a0"}
    </span>
  );
}

function useSyncedScrollPair() {
  const syncing = useRef(false);

  return useCallback((source: HTMLElement, target: HTMLElement) => {
    if (syncing.current) return;
    syncing.current = true;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);
}

export function TextDiffChecker({ labels, className }: TextDiffCheckerProps) {
  const originalId = useId();
  const changedId = useId();
  const originalRef = useRef<HTMLTextAreaElement>(null);
  const changedRef = useRef<HTMLTextAreaElement>(null);
  const resultOriginalRef = useRef<HTMLDivElement>(null);
  const resultChangedRef = useRef<HTMLDivElement>(null);
  const syncScroll = useSyncedScrollPair();

  const [original, setOriginal] = useState("");
  const [changed, setChanged] = useState("");
  const [rows, setRows] = useState<SideBySideDiffRow[]>([]);
  const [stats, setStats] = useState<{ additions: number; deletions: number; unchanged: number } | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!original && !changed) {
        setRows([]);
        setStats(null);
        return;
      }
      const result = compareTextDiff(original, changed);
      setRows(result.rows);
      setStats({
        additions: result.additions,
        deletions: result.deletions,
        unchanged: result.unchanged,
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [original, changed]);

  const onSwap = () => {
    setOriginal(changed);
    setChanged(original);
  };

  const onClear = () => {
    setOriginal("");
    setChanged("");
    setRows([]);
    setStats(null);
  };

  const onOriginalScroll = () => {
    const source = originalRef.current;
    const target = changedRef.current;
    if (source && target) syncScroll(source, target);
  };

  const onChangedScroll = () => {
    const source = changedRef.current;
    const target = originalRef.current;
    if (source && target) syncScroll(source, target);
  };

  const onResultOriginalScroll = () => {
    const source = resultOriginalRef.current;
    const target = resultChangedRef.current;
    if (source && target) syncScroll(source, target);
  };

  const onResultChangedScroll = () => {
    const source = resultChangedRef.current;
    const target = resultOriginalRef.current;
    if (source && target) syncScroll(source, target);
  };

  const hasContent = Boolean(original || changed);

  return (
    <div className={clsx("text-diff-tool", className)}>
      <div className="text-diff-tool__inputs">
        <div className="text-diff-tool__input tool-workspace-panel">
          <label htmlFor={originalId} className="text-diff-tool__label">
            {labels.originalLabel}
          </label>
          <textarea
            id={originalId}
            ref={originalRef}
            className="text-diff-tool__textarea"
            value={original}
            onChange={(event) => setOriginal(event.target.value)}
            onScroll={onOriginalScroll}
            placeholder={labels.originalPlaceholder}
            spellCheck={false}
            rows={16}
          />
        </div>

        <div className="text-diff-tool__input tool-workspace-panel">
          <label htmlFor={changedId} className="text-diff-tool__label">
            {labels.changedLabel}
          </label>
          <textarea
            id={changedId}
            ref={changedRef}
            className="text-diff-tool__textarea"
            value={changed}
            onChange={(event) => setChanged(event.target.value)}
            onScroll={onChangedScroll}
            placeholder={labels.changedPlaceholder}
            spellCheck={false}
            rows={16}
          />
        </div>
      </div>

      <div className="text-diff-tool__actions tool-workspace-panel">
        <div className="text-diff-tool__action-row">
          <button type="button" className="text-diff-tool__compare-btn" onClick={onSwap} disabled={!hasContent}>
            {labels.swapButton}
          </button>
          <button type="button" className="text-diff-tool__secondary-btn" onClick={onClear} disabled={!hasContent}>
            {labels.clearButton}
          </button>
        </div>
        {stats ? (
          <p className="text-diff-tool__stats">
            {labels.statsLabel
              .replace("{added}", String(stats.additions))
              .replace("{removed}", String(stats.deletions))
              .replace("{unchanged}", String(stats.unchanged))}
          </p>
        ) : (
          <p className="text-diff-tool__stats text-diff-tool__stats--hint">{labels.emptyHint}</p>
        )}
        <p className="text-diff-tool__privacy">{labels.privacyLabel}</p>
      </div>

      {hasContent ? (
        <div className="text-diff-tool__result">
          <div className="text-diff-tool__result-column tool-workspace-panel">
            <span className="text-diff-tool__label">{labels.resultOriginalLabel}</span>
            <div
              ref={resultOriginalRef}
              className="text-diff-tool__result-pane"
              onScroll={onResultOriginalScroll}
            >
              {rows.length === 0 ? (
                <p className="text-diff-tool__empty">{labels.emptyDiff}</p>
              ) : (
                rows.map((row, index) => <DiffLineCell key={`left-${index}`} line={row.left} />)
              )}
            </div>
          </div>

          <div className="text-diff-tool__result-column tool-workspace-panel">
            <span className="text-diff-tool__label">{labels.resultChangedLabel}</span>
            <div
              ref={resultChangedRef}
              className="text-diff-tool__result-pane"
              onScroll={onResultChangedScroll}
            >
              {rows.length === 0 ? (
                <p className="text-diff-tool__empty">{labels.emptyDiff}</p>
              ) : (
                rows.map((row, index) => <DiffLineCell key={`right-${index}`} line={row.right} />)
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
