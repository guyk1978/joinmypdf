"use client";

import { useId, useRef, useState, type ClipboardEvent } from "react";
import { clsx } from "clsx";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import { stripUrlParameters } from "@/lib/url-parameter-stripper";

export type UrlParameterStripperLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  decodeLabel: string;
  autoStripLabel: string;
  stripButton: string;
  clearButton: string;
  outputLabel: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  removedLabel: string;
  emptyHint: string;
  errorEmpty: string;
  errorInvalid: string;
  unchangedHint: string;
  privacyLabel: string;
  pageTitle: string;
};

type UrlParameterStripperProps = {
  labels: UrlParameterStripperLabels;
  className?: string;
};

export function UrlParameterStripper({ labels, className }: UrlParameterStripperProps) {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const [decodeUrl, setDecodeUrl] = useState(true);
  const [autoStripOnPaste, setAutoStripOnPaste] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);
  const decodeRef = useRef(decodeUrl);
  decodeRef.current = decodeUrl;

  const runStrip = (raw: string) => {
    const result = stripUrlParameters(raw, { decodeUrl: decodeRef.current });
    if (!result.ok) {
      setOutput(null);
      setRemovedKeys([]);
      setCompleted(false);
      setError(result.code === "empty" ? labels.errorEmpty : labels.errorInvalid);
      return;
    }
    setError(null);
    setOutput(result.url);
    setRemovedKeys(result.removedKeys);
    setCompleted(true);
    setCopied(false);
  };

  const handleStrip = () => runStrip(input);

  const handleClear = () => {
    setInput("");
    setOutput(null);
    setRemovedKeys([]);
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

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (!autoStripOnPaste) return;
    const pasted = event.clipboardData.getData("text");
    if (!pasted.trim()) return;
    event.preventDefault();
    setInput(pasted);
    runStrip(pasted);
  };

  return (
    <div className={clsx("url-stripper-tool", className)}>
      <div className="url-stripper-tool__panel tool-workspace-panel security-tool__pane">
        <label htmlFor={inputId} className="security-tool__label">
          {labels.inputLabel}
        </label>
        <input
          id={inputId}
          type="url"
          className="url-stripper-tool__input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError(null);
          }}
          onPaste={handlePaste}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          autoComplete="off"
        />

        <div className="url-stripper-tool__options">
          <label className="url-stripper-tool__checkbox">
            <input
              type="checkbox"
              checked={decodeUrl}
              onChange={() => setDecodeUrl((value) => !value)}
            />
            <span>{labels.decodeLabel}</span>
          </label>
          <label className="url-stripper-tool__checkbox">
            <input
              type="checkbox"
              checked={autoStripOnPaste}
              onChange={() => setAutoStripOnPaste((value) => !value)}
            />
            <span>{labels.autoStripLabel}</span>
          </label>
        </div>

        <div className="url-stripper-tool__actions">
          <button type="button" className="security-tool__action-btn" onClick={handleStrip}>
            {labels.stripButton}
          </button>
          <button type="button" className="security-tool__copy-btn" onClick={handleClear}>
            {labels.clearButton}
          </button>
        </div>

        <p className="security-tool__hint">{labels.privacyLabel}</p>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {output === null && !error ? (
        <p className="url-stripper-tool__empty-hint">{labels.emptyHint}</p>
      ) : null}

      {output !== null ? (
        <section
          className="url-stripper-tool__output-section"
          aria-labelledby="url-stripper-output-title"
        >
          <div className="url-stripper-tool__output-header">
            <h2 id="url-stripper-output-title" className="security-tool__section-title">
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
            className="security-tool__textarea url-stripper-tool__output"
            value={output}
            readOnly
            rows={4}
            spellCheck={false}
            aria-label={labels.outputLabel}
          />
          {removedKeys.length > 0 ? (
            <p className="url-stripper-tool__removed">
              {labels.removedLabel}: {removedKeys.join(", ")}
            </p>
          ) : (
            <p className="url-stripper-tool__unchanged">{labels.unchangedHint}</p>
          )}
        </section>
      ) : null}

      {completed ? (
        <ToolSuccessEngagement
          pageTitle={labels.pageTitle}
          className="url-stripper-tool__engagement"
        />
      ) : null}
    </div>
  );
}
