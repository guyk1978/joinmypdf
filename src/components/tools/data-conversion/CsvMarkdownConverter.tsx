"use client";

import { useEffect, useId, useState } from "react";
import { clsx } from "clsx";
import { convertCsvToMarkdownTable, copyTextToClipboard } from "@/lib/csv-markdown-converter";

export type CsvMarkdownConverterLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  outputLabel: string;
  outputEmpty: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  errorEmpty: string;
  errorParse: string;
};

type CsvMarkdownConverterProps = {
  labels: CsvMarkdownConverterLabels;
  className?: string;
};

export function CsvMarkdownConverter({ labels, className }: CsvMarkdownConverterProps) {
  const inputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const result = convertCsvToMarkdownTable(input);
      if (!result.ok) {
        setOutput("");
        setError(result.error === "empty" ? labels.errorEmpty : labels.errorParse);
        return;
      }

      setOutput(result.markdown);
      setError(null);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [input, labels.errorEmpty, labels.errorParse]);

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
    <div className={clsx("csv-markdown-tool", className)}>
      <section className="data-conv-tool__pane tool-workspace-panel">
        <label className="data-conv-tool__label" htmlFor={inputId}>
          {labels.inputLabel}
        </label>
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
        <pre className="data-conv-tool__output" aria-live="polite">
          {output || labels.outputEmpty}
        </pre>
      </section>
    </div>
  );
}
