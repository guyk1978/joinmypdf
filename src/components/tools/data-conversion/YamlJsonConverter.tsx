"use client";

import { useEffect, useId, useState } from "react";
import { clsx } from "clsx";
import {
  convertYamlJson,
  copyTextToClipboard,
  type YamlJsonDirection,
} from "@/lib/yaml-json-converter";

export type YamlJsonConverterLabels = {
  yamlInputLabel: string;
  jsonInputLabel: string;
  yamlOutputLabel: string;
  jsonOutputLabel: string;
  yamlPlaceholder: string;
  jsonPlaceholder: string;
  switchDirection: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  errorEmpty: string;
  errorParse: string;
};

type YamlJsonConverterProps = {
  labels: YamlJsonConverterLabels;
  className?: string;
};

export function YamlJsonConverter({ labels, className }: YamlJsonConverterProps) {
  const inputId = useId();
  const [direction, setDirection] = useState<YamlJsonDirection>("yaml-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputIsYaml = direction === "yaml-to-json";

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const result = convertYamlJson(input, direction);
      if (!result.ok) {
        setOutput("");
        setError(result.error === "empty" ? labels.errorEmpty : labels.errorParse);
        return;
      }

      setOutput(result.output);
      setError(null);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [input, direction, labels.errorEmpty, labels.errorParse]);

  const onSwitchDirection = () => {
    setDirection((current) => (current === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json"));
    setInput(output);
    setOutput(input);
    setError(null);
  };

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
    <div className={clsx("yaml-json-tool", className)}>
      {error ? (
        <p className="data-conv-tool__error" role="status">
          {error}
        </p>
      ) : null}

      <div className="yaml-json-tool__layout">
        <section className="data-conv-tool__pane tool-workspace-panel">
          <div className="data-conv-tool__pane-header">
            <label className="data-conv-tool__label" htmlFor={inputId}>
              {inputIsYaml ? labels.yamlInputLabel : labels.jsonInputLabel}
            </label>
          </div>
          <textarea
            id={inputId}
            className="data-conv-tool__textarea"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={inputIsYaml ? labels.yamlPlaceholder : labels.jsonPlaceholder}
            spellCheck={false}
            rows={18}
          />
        </section>

        <div className="yaml-json-tool__switch">
          <button
            type="button"
            className="yaml-json-tool__switch-btn"
            onClick={onSwitchDirection}
            aria-label={labels.switchDirection}
            title={labels.switchDirection}
          >
            ⇄
          </button>
        </div>

        <section className="data-conv-tool__pane tool-workspace-panel">
          <div className="data-conv-tool__pane-header">
            <span className="data-conv-tool__label">
              {inputIsYaml ? labels.jsonOutputLabel : labels.yamlOutputLabel}
            </span>
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
            {output || "\u00a0"}
          </pre>
        </section>
      </div>
    </div>
  );
}
