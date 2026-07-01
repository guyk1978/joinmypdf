"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  decodeUrlComponent,
  encodeUrlComponent,
} from "@/lib/url-encoder-decoder";

export type UrlEncoderDecoderLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  outputLabel: string;
  encodeButton: string;
  decodeButton: string;
  copyButton: string;
  clearButton: string;
  copied: string;
  copyFailed: string;
};

type UrlEncoderDecoderProps = {
  labels: UrlEncoderDecoderLabels;
  className?: string;
};

export function UrlEncoderDecoder({ labels, className }: UrlEncoderDecoderProps) {
  const inputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onEncode = () => {
    const result = encodeUrlComponent(input);
    if (result.ok) {
      setOutput(result.result);
      setError(null);
      return;
    }

    setError(result.error);
  };

  const onDecode = () => {
    const result = decodeUrlComponent(input);
    if (result.ok) {
      setOutput(result.result);
      setError(null);
      return;
    }

    setError(result.error);
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

  const onClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setCopied(false);
  };

  return (
    <div className={clsx("url-codec-tool", className)}>
      <div className="url-codec-tool__input tool-workspace-panel">
        <label htmlFor={inputId} className="url-codec-tool__label">
          {labels.inputLabel}
        </label>
        <textarea
          id={inputId}
          className="url-codec-tool__textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={10}
        />
      </div>

      <div className="url-codec-tool__controls tool-workspace-panel">
        <button
          type="button"
          className="url-codec-tool__action-btn"
          onClick={onEncode}
          disabled={!input}
        >
          {labels.encodeButton}
        </button>
        <button
          type="button"
          className="url-codec-tool__action-btn"
          onClick={onDecode}
          disabled={!input}
        >
          {labels.decodeButton}
        </button>
        <button type="button" className="url-codec-tool__clear-btn" onClick={onClear}>
          {labels.clearButton}
        </button>
      </div>

      {error ? (
        <p className="url-codec-tool__error" role="status">
          {error}
        </p>
      ) : null}

      <div className="url-codec-tool__output tool-workspace-panel">
        <div className="url-codec-tool__output-header">
          <span className="url-codec-tool__label">{labels.outputLabel}</span>
          <button
            type="button"
            className={clsx("url-codec-tool__copy-btn", copied && "url-codec-tool__copy-btn--copied")}
            onClick={() => void onCopy()}
            disabled={!output}
          >
            {copied ? labels.copied : labels.copyButton}
          </button>
        </div>
        <pre className="url-codec-tool__code" aria-live="polite">
          {output || "\u00a0"}
        </pre>
      </div>
    </div>
  );
}
