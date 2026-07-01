"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  convertCsvToJson,
  copyTextToClipboard,
  downloadCsvToJson,
} from "@/lib/csv-to-json";

export type CsvToJsonLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  headersLabel: string;
  convertButton: string;
  outputLabel: string;
  copyButton: string;
  downloadButton: string;
  copied: string;
  copyFailed: string;
};

type CsvToJsonProps = {
  labels: CsvToJsonLabels;
  className?: string;
};

export function CsvToJson({ labels, className }: CsvToJsonProps) {
  const [input, setInput] = useState("");
  const [useFirstRowAsHeaders, setUseFirstRowAsHeaders] = useState(true);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runConvert = useCallback(
    (raw: string, headersEnabled: boolean) => {
      const result = convertCsvToJson(raw, { useFirstRowAsHeaders: headersEnabled });
      if (result.ok) {
        setOutput(result.json);
        setError(null);
        return;
      }

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

    const timer = window.setTimeout(() => runConvert(input, useFirstRowAsHeaders), 400);
    return () => window.clearTimeout(timer);
  }, [input, useFirstRowAsHeaders, runConvert]);

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

  const onDownload = () => {
    if (!output) return;
    downloadCsvToJson(output);
  };

  return (
    <div className={clsx("csv-to-json-tool", className)}>
      <div className="csv-to-json-tool__input tool-workspace-panel">
        <label htmlFor="csv-to-json-input" className="csv-to-json-tool__label">
          {labels.inputLabel}
        </label>
        <textarea
          id="csv-to-json-input"
          className="csv-to-json-tool__textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={12}
        />

        <label className="csv-to-json-tool__checkbox">
          <input
            type="checkbox"
            checked={useFirstRowAsHeaders}
            onChange={(event) => setUseFirstRowAsHeaders(event.target.checked)}
          />
          <span>{labels.headersLabel}</span>
        </label>

        <div className="csv-to-json-tool__actions">
          <button
            type="button"
            className="csv-to-json-tool__convert-btn"
            onClick={() => runConvert(input, useFirstRowAsHeaders)}
            disabled={!input.trim()}
          >
            {labels.convertButton}
          </button>
        </div>
      </div>

      {error ? (
        <p className="csv-to-json-tool__error" role="status">
          {error}
        </p>
      ) : null}

      {output ? (
        <div className="csv-to-json-tool__output tool-workspace-panel">
          <div className="csv-to-json-tool__output-header">
            <span className="csv-to-json-tool__label">{labels.outputLabel}</span>
            <div className="csv-to-json-tool__output-actions">
              <button
                type="button"
                className={clsx(
                  "csv-to-json-tool__copy-btn",
                  copied && "csv-to-json-tool__copy-btn--copied",
                )}
                onClick={() => void onCopy()}
              >
                {copied ? labels.copied : labels.copyButton}
              </button>
              <button
                type="button"
                className="csv-to-json-tool__download-btn"
                onClick={onDownload}
              >
                {labels.downloadButton}
              </button>
            </div>
          </div>
          <pre className="csv-to-json-tool__code" aria-live="polite">
            {output}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
