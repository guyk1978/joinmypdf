"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { copyTextToClipboard, minifyJson } from "@/lib/json-minifier";

export type JsonMinifierLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  minifyButton: string;
  outputLabel: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
};

type JsonMinifierProps = {
  labels: JsonMinifierLabels;
  className?: string;
};

export function JsonMinifier({ labels, className }: JsonMinifierProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runMinify = useCallback((raw: string) => {
    const result = minifyJson(raw);
    if (result.ok) {
      setOutput(result.minified);
      setError(null);
      return;
    }

    setOutput("");
    setError(result.error);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => runMinify(input), 300);
    return () => window.clearTimeout(timer);
  }, [input, runMinify]);

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
    <div className={clsx("json-minifier-tool", className)}>
      <div className="json-minifier-tool__input tool-workspace-panel">
        <label htmlFor="json-minifier-input" className="json-minifier-tool__label">
          {labels.inputLabel}
        </label>
        <textarea
          id="json-minifier-input"
          className="json-minifier-tool__textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={12}
        />
        <div className="json-minifier-tool__actions">
          <button
            type="button"
            className="json-minifier-tool__minify-btn"
            onClick={() => runMinify(input)}
            disabled={!input.trim()}
          >
            {labels.minifyButton}
          </button>
        </div>
      </div>

      {error ? (
        <p className="json-minifier-tool__error" role="status">
          {error}
        </p>
      ) : null}

      {output ? (
        <div className="json-minifier-tool__output tool-workspace-panel">
          <div className="json-minifier-tool__output-header">
            <span className="json-minifier-tool__label">{labels.outputLabel}</span>
            <button
              type="button"
              className={clsx(
                "json-minifier-tool__copy-btn",
                copied && "json-minifier-tool__copy-btn--copied",
              )}
              onClick={() => void onCopy()}
            >
              {copied ? labels.copied : labels.copyButton}
            </button>
          </div>
          <pre className="json-minifier-tool__code" aria-live="polite">
            {output}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
