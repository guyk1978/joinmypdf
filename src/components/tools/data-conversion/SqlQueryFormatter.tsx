"use client";

import { useEffect, useId, useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  formatSqlQuery,
  type SqlIndentOption,
  type SqlKeywordCaseOption,
} from "@/lib/sql-query-formatter";

export type SqlQueryFormatterLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  outputLabel: string;
  outputEmpty: string;
  indentLabel: string;
  indent2: string;
  indent4: string;
  indentTab: string;
  keywordsLabel: string;
  keywordsUpper: string;
  keywordsLower: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  errorEmpty: string;
  errorParse: string;
};

type SqlQueryFormatterProps = {
  labels: SqlQueryFormatterLabels;
  className?: string;
};

const INDENT_OPTIONS: { value: SqlIndentOption; labelKey: keyof SqlQueryFormatterLabels }[] = [
  { value: "2", labelKey: "indent2" },
  { value: "4", labelKey: "indent4" },
  { value: "tab", labelKey: "indentTab" },
];

export function SqlQueryFormatter({ labels, className }: SqlQueryFormatterProps) {
  const inputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<SqlIndentOption>("2");
  const [keywordCase, setKeywordCase] = useState<SqlKeywordCaseOption>("upper");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const result = formatSqlQuery(input, indent, keywordCase);
      if (!result.ok) {
        setOutput("");
        setError(result.error === "empty" ? labels.errorEmpty : labels.errorParse);
        return;
      }

      setOutput(result.sql);
      setError(null);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [input, indent, keywordCase, labels.errorEmpty, labels.errorParse]);

  const onCopy = async () => {
    if (!output) return;
    const success = await copyTextToClipboard(output);
    if (!success) {
      setError(labels.copyFailed);
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={clsx("sql-query-tool", className)}>
      <section className="data-conv-tool__pane tool-workspace-panel">
        <div className="data-conv-tool__pane-header">
          <label className="data-conv-tool__label" htmlFor={inputId}>
            {labels.inputLabel}
          </label>
        </div>

        <div className="sql-query-tool__options">
          <div className="sql-query-tool__field">
            <span className="data-conv-tool__label">{labels.indentLabel}</span>
            <div className="sql-query-tool__toggle" role="group" aria-label={labels.indentLabel}>
              {INDENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(
                    "sql-query-tool__toggle-btn",
                    indent === option.value && "sql-query-tool__toggle-btn--active",
                  )}
                  aria-pressed={indent === option.value}
                  onClick={() => setIndent(option.value)}
                >
                  {labels[option.labelKey]}
                </button>
              ))}
            </div>
          </div>

          <div className="sql-query-tool__field">
            <span className="data-conv-tool__label">{labels.keywordsLabel}</span>
            <div className="sql-query-tool__toggle" role="group" aria-label={labels.keywordsLabel}>
              <button
                type="button"
                className={clsx(
                  "sql-query-tool__toggle-btn",
                  keywordCase === "upper" && "sql-query-tool__toggle-btn--active",
                )}
                aria-pressed={keywordCase === "upper"}
                onClick={() => setKeywordCase("upper")}
              >
                {labels.keywordsUpper}
              </button>
              <button
                type="button"
                className={clsx(
                  "sql-query-tool__toggle-btn",
                  keywordCase === "lower" && "sql-query-tool__toggle-btn--active",
                )}
                aria-pressed={keywordCase === "lower"}
                onClick={() => setKeywordCase("lower")}
              >
                {labels.keywordsLower}
              </button>
            </div>
          </div>
        </div>

        <textarea
          id={inputId}
          className="data-conv-tool__textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={14}
        />
      </section>

      {error ? (
        <p className="data-conv-tool__error" role="status">
          {error}
        </p>
      ) : null}

      <section className="data-conv-tool__pane tool-workspace-panel">
        <div className="data-conv-tool__pane-header">
          <span className="data-conv-tool__label">{labels.outputLabel}</span>
          <button
            type="button"
            className={clsx("data-conv-tool__copy-btn", copied && "data-conv-tool__copy-btn--copied")}
            onClick={() => void onCopy()}
            disabled={!output}
          >
            {copied ? labels.copied : labels.copyButton}
          </button>
        </div>
        <pre className="data-conv-tool__output data-conv-tool__output--sql" aria-live="polite">
          {output || labels.outputEmpty}
        </pre>
      </section>
    </div>
  );
}
