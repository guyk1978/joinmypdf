"use client";

import { useCallback, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { compareTextDiff, type SideBySideDiffRow } from "@/lib/text-diff";

export type TextDiffCheckerLabels = {
  originalLabel: string;
  originalPlaceholder: string;
  changedLabel: string;
  changedPlaceholder: string;
  compareButton: string;
  resultOriginalLabel: string;
  resultChangedLabel: string;
  emptyDiff: string;
  statsLabel: string;
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
  const [rows, setRows] = useState<SideBySideDiffRow[] | null>(null);
  const [stats, setStats] = useState<{ additions: number; deletions: number; unchanged: number } | null>(
    null,
  );

  const onCompare = () => {
    const result = compareTextDiff(original, changed);
    setRows(result.rows);
    setStats({
      additions: result.additions,
      deletions: result.deletions,
      unchanged: result.unchanged,
    });
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

  const hasDiff = rows !== null;

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
            rows={12}
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
            rows={12}
          />
        </div>
      </div>

      <div className="text-diff-tool__actions tool-workspace-panel">
        <button
          type="button"
          className="text-diff-tool__compare-btn"
          onClick={onCompare}
          disabled={!original && !changed}
        >
          {labels.compareButton}
        </button>
        {stats ? (
          <p className="text-diff-tool__stats">
            {labels.statsLabel
              .replace("{added}", String(stats.additions))
              .replace("{removed}", String(stats.deletions))
              .replace("{unchanged}", String(stats.unchanged))}
          </p>
        ) : null}
      </div>

      {hasDiff ? (
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
