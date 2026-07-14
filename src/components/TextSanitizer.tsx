"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { compareTextDiff } from "@/lib/text-diff";
import {
  DEFAULT_SANITIZE_OPTIONS,
  sanitizeText,
  type SanitizeOptions,
} from "@/lib/text-sanitizer";

export type TextSanitizerLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  optionsTitle: string;
  optionFixLineBreaks: string;
  optionRemoveExtraSpaces: string;
  optionCleanInvisible: string;
  optionFixHebrew: string;
  cleanButton: string;
  clearButton: string;
  outputLabel: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  diffLabel: string;
  emptyHint: string;
  errorEmpty: string;
  unchangedHint: string;
  privacyLabel: string;
  pageTitle: string;
};

type TextSanitizerProps = {
  labels: TextSanitizerLabels;
  className?: string;
};

type OptionKey = keyof SanitizeOptions;

const OPTION_KEYS: OptionKey[] = [
  "fixLineBreaks",
  "removeExtraSpaces",
  "cleanInvisibleChars",
  "fixHebrewPunctuation",
];

export function TextSanitizer({ labels, className }: TextSanitizerProps) {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [options, setOptions] = useState<SanitizeOptions>(DEFAULT_SANITIZE_OPTIONS);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

  const optionLabels: Record<OptionKey, string> = {
    fixLineBreaks: labels.optionFixLineBreaks,
    removeExtraSpaces: labels.optionRemoveExtraSpaces,
    cleanInvisibleChars: labels.optionCleanInvisible,
    fixHebrewPunctuation: labels.optionFixHebrew,
  };

  const diff = useMemo(() => {
    if (output === null) return null;
    return compareTextDiff(input, output);
  }, [input, output]);

  const handleClean = () => {
    if (!input.trim()) {
      setError(labels.errorEmpty);
      setOutput(null);
      setCompleted(false);
      return;
    }

    const cleaned = sanitizeText(input, options);
    setError(null);
    setOutput(cleaned);
    setCompleted(true);
    setCopied(false);
  };

  const handleClear = () => {
    setInput("");
    setOutput(null);
    setError(null);
    setCompleted(false);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (output === null) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(labels.copyFailed);
    }
  };

  const toggleOption = (key: OptionKey) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={clsx("text-sanitizer-tool", className)}>
      <div className="text-sanitizer-tool__layout">
        <div className="text-sanitizer-tool__main tool-workspace-panel security-tool__pane">
          <label htmlFor={inputId} className="security-tool__label">
            {labels.inputLabel}
          </label>
          <textarea
            id={inputId}
            className="security-tool__textarea text-sanitizer-tool__textarea"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            placeholder={labels.inputPlaceholder}
            spellCheck={false}
            rows={14}
          />
          <p className="security-tool__hint">{labels.privacyLabel}</p>
        </div>

        <aside className="text-sanitizer-tool__sidebar tool-workspace-panel security-tool__pane">
          <h2 className="security-tool__section-title">{labels.optionsTitle}</h2>
          <ul className="text-sanitizer-tool__options">
            {OPTION_KEYS.map((key) => (
              <li key={key}>
                <label className="text-sanitizer-tool__checkbox">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={() => toggleOption(key)}
                  />
                  <span>{optionLabels[key]}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="text-sanitizer-tool__actions">
            <button type="button" className="security-tool__action-btn" onClick={handleClean}>
              {labels.cleanButton}
            </button>
            <button type="button" className="security-tool__copy-btn" onClick={handleClear}>
              {labels.clearButton}
            </button>
          </div>
        </aside>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {output === null && !error ? (
        <p className="text-sanitizer-tool__empty-hint">{labels.emptyHint}</p>
      ) : null}

      {output !== null ? (
        <section
          className="text-sanitizer-tool__output-section"
          aria-labelledby="text-sanitizer-output-title"
        >
          <div className="text-sanitizer-tool__output-header">
            <h2 id="text-sanitizer-output-title" className="security-tool__section-title">
              {labels.outputLabel}
            </h2>
            <button
              type="button"
              className={clsx("security-tool__copy-btn", copied && "security-tool__copy-btn--copied")}
              onClick={handleCopy}
            >
              {copied ? labels.copied : labels.copyButton}
            </button>
          </div>
          <textarea
            id={outputId}
            className="security-tool__textarea text-sanitizer-tool__textarea"
            value={output}
            readOnly
            rows={10}
            spellCheck={false}
            aria-label={labels.outputLabel}
          />

          {diff && (diff.additions > 0 || diff.deletions > 0) ? (
            <div className="text-sanitizer-tool__diff" aria-label={labels.diffLabel}>
              <h3 className="text-sanitizer-tool__diff-title">{labels.diffLabel}</h3>
              <div className="text-sanitizer-tool__diff-pane" role="region">
                {diff.rows.map((row, index) => {
                  const right = row.right;
                  if (!right) {
                    return (
                      <div
                        key={`d-${index}`}
                        className="text-diff-tool__line text-diff-tool__line--removed"
                      >
                        {row.left?.text || " "}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`d-${index}`}
                      className={clsx(
                        "text-diff-tool__line",
                        right.kind === "added" && "text-diff-tool__line--added",
                        right.kind === "removed" && "text-diff-tool__line--removed",
                      )}
                    >
                      {right.text || " "}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sanitizer-tool__unchanged">{labels.unchangedHint}</p>
          )}
        </section>
      ) : null}

      {completed ? (
        <ToolSuccessEngagement pageTitle={labels.pageTitle} className="text-sanitizer-tool__engagement" />
      ) : null}
    </div>
  );
}
