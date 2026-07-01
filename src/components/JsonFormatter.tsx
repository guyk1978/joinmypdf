"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  formatJson,
  tokenizeJsonLine,
  type JsonToken,
} from "@/lib/json-formatter";

export type JsonFormatterLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  formatButton: string;
  outputLabel: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  emptyInput: string;
};

type JsonFormatterProps = {
  labels: JsonFormatterLabels;
  className?: string;
};

function HighlightedJsonLine({ tokens }: { tokens: JsonToken[] }) {
  return (
    <span className="json-formatter-tool__code-line">
      {tokens.map((token, index) => (
        <span
          key={`${index}-${token.text}`}
          className={clsx(
            token.kind === "key" && "json-formatter-tool__token--key",
            token.kind === "string" && "json-formatter-tool__token--string",
            token.kind === "number" && "json-formatter-tool__token--number",
            token.kind === "boolean" && "json-formatter-tool__token--boolean",
            token.kind === "null" && "json-formatter-tool__token--null",
            token.kind === "punctuation" && "json-formatter-tool__token--punctuation",
          )}
        >
          {token.text}
        </span>
      ))}
    </span>
  );
}

export function JsonFormatter({ labels, className }: JsonFormatterProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runFormat = useCallback(
    (raw: string) => {
      const result = formatJson(raw);
      if (result.ok) {
        setOutput(result.formatted);
        setError(null);
        return;
      }

      setOutput("");
      setError(result.error);
    },
    [],
  );

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => runFormat(input), 400);
    return () => window.clearTimeout(timer);
  }, [input, runFormat]);

  const highlightedLines = useMemo(
    () => (output ? output.split("\n").map((line) => tokenizeJsonLine(line)) : []),
    [output],
  );

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
    <div className={clsx("json-formatter-tool", className)}>
      <div className="json-formatter-tool__input tool-workspace-panel">
        <label htmlFor="json-formatter-input" className="json-formatter-tool__label">
          {labels.inputLabel}
        </label>
        <textarea
          id="json-formatter-input"
          className="json-formatter-tool__textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={12}
        />
        <div className="json-formatter-tool__actions">
          <button
            type="button"
            className="json-formatter-tool__format-btn"
            onClick={() => runFormat(input)}
            disabled={!input.trim()}
          >
            {labels.formatButton}
          </button>
        </div>
      </div>

      {error ? (
        <p className="json-formatter-tool__error" role="status">
          {error}
        </p>
      ) : null}

      {output ? (
        <div className="json-formatter-tool__output tool-workspace-panel">
          <div className="json-formatter-tool__output-header">
            <span className="json-formatter-tool__label">{labels.outputLabel}</span>
            <button
              type="button"
              className={clsx(
                "json-formatter-tool__copy-btn",
                copied && "json-formatter-tool__copy-btn--copied",
              )}
              onClick={() => void onCopy()}
            >
              {copied ? labels.copied : labels.copyButton}
            </button>
          </div>
          <pre className="json-formatter-tool__code" aria-live="polite">
            {highlightedLines.map((tokens, index) => (
              <HighlightedJsonLine key={index} tokens={tokens} />
            ))}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
