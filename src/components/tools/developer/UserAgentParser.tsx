"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  getNavigatorUserAgent,
  parseUserAgent,
  parsedUserAgentToJson,
  type ParsedUserAgent,
} from "@/lib/user-agent-parser";

export type UserAgentParserLabels = {
  liveTitle: string;
  liveHint: string;
  rawUaLabel: string;
  manualTitle: string;
  manualHint: string;
  inputLabel: string;
  inputPlaceholder: string;
  parseButton: string;
  resultsTitle: string;
  browserSection: string;
  osSection: string;
  deviceSection: string;
  engineSection: string;
  nameLabel: string;
  versionLabel: string;
  modelLabel: string;
  typeLabel: string;
  copyJsonButton: string;
  copied: string;
  copyFailed: string;
};

type UserAgentParserProps = {
  labels: UserAgentParserLabels;
  className?: string;
};

type FieldProps = {
  label: string;
  value: string;
};

function Field({ label, value }: FieldProps) {
  return (
    <div className="ua-parser-tool__field">
      <span className="ua-parser-tool__field-label">{label}</span>
      <span className="ua-parser-tool__field-value">{value}</span>
    </div>
  );
}

type ResultCardProps = {
  title: string;
  children: ReactNode;
};

function ResultCard({ title, children }: ResultCardProps) {
  return (
    <article className="ua-parser-tool__card">
      <h3 className="ua-parser-tool__card-title">{title}</h3>
      <div className="ua-parser-tool__card-body">{children}</div>
    </article>
  );
}

type ResultGridProps = {
  labels: UserAgentParserLabels;
  parsed: ParsedUserAgent;
};

function ResultGrid({ labels, parsed }: ResultGridProps) {
  return (
    <div className="ua-parser-tool__grid">
      <ResultCard title={labels.browserSection}>
        <Field label={labels.nameLabel} value={parsed.browser.name} />
        <Field label={labels.versionLabel} value={parsed.browser.version} />
      </ResultCard>
      <ResultCard title={labels.osSection}>
        <Field label={labels.nameLabel} value={parsed.os.name} />
        <Field label={labels.versionLabel} value={parsed.os.version} />
      </ResultCard>
      <ResultCard title={labels.deviceSection}>
        <Field label={labels.modelLabel} value={parsed.device.model} />
        <Field label={labels.typeLabel} value={parsed.device.type} />
      </ResultCard>
      <ResultCard title={labels.engineSection}>
        <Field label={labels.nameLabel} value={parsed.engine.name} />
        <Field label={labels.versionLabel} value={parsed.engine.version} />
      </ResultCard>
    </div>
  );
}

type ResultsPanelProps = {
  labels: UserAgentParserLabels;
  parsed: ParsedUserAgent;
  title: string;
};

function ResultsPanel({ labels, parsed, title }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const onCopyJson = async () => {
    const success = await copyTextToClipboard(parsedUserAgentToJson(parsed));
    if (!success) {
      setCopyError(labels.copyFailed);
      return;
    }

    setCopyError(null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="ua-parser-tool__results">
      <div className="ua-parser-tool__results-header">
        <h2 className="ua-parser-tool__section-title">{title}</h2>
        <button
          type="button"
          className={clsx("ua-parser-tool__copy-btn", copied && "ua-parser-tool__copy-btn--copied")}
          onClick={() => void onCopyJson()}
        >
          {copied ? labels.copied : labels.copyJsonButton}
        </button>
      </div>
      {copyError ? (
        <p className="ua-parser-tool__error" role="status">
          {copyError}
        </p>
      ) : null}
      <ResultGrid labels={labels} parsed={parsed} />
    </div>
  );
}

export function UserAgentParser({ labels, className }: UserAgentParserProps) {
  const inputId = useId();
  const [liveParsed, setLiveParsed] = useState<ParsedUserAgent | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [manualParsed, setManualParsed] = useState<ParsedUserAgent | null>(null);

  useEffect(() => {
    const current = getNavigatorUserAgent();
    if (!current) return;
    setLiveParsed(parseUserAgent(current));
  }, []);

  const onParse = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) {
      setManualParsed(null);
      return;
    }
    setManualParsed(parseUserAgent(trimmed));
  };

  return (
    <div className={clsx("ua-parser-tool", className)}>
      {liveParsed ? (
        <section className="ua-parser-tool__live tool-workspace-panel" aria-labelledby="ua-parser-live">
          <div className="ua-parser-tool__section-intro">
            <h2 id="ua-parser-live" className="ua-parser-tool__section-title">
              {labels.liveTitle}
            </h2>
            <p className="ua-parser-tool__section-hint">{labels.liveHint}</p>
          </div>

          <div className="ua-parser-tool__raw-block">
            <span className="ua-parser-tool__label">{labels.rawUaLabel}</span>
            <pre className="ua-parser-tool__raw-ua" aria-live="polite">
              {liveParsed.userAgent}
            </pre>
          </div>

          <ResultsPanel labels={labels} parsed={liveParsed} title={labels.resultsTitle} />
        </section>
      ) : null}

      <section className="ua-parser-tool__manual tool-workspace-panel" aria-labelledby="ua-parser-manual">
        <div className="ua-parser-tool__section-intro">
          <h2 id="ua-parser-manual" className="ua-parser-tool__section-title">
            {labels.manualTitle}
          </h2>
          <p className="ua-parser-tool__section-hint">{labels.manualHint}</p>
        </div>

        <label className="ua-parser-tool__label" htmlFor={inputId}>
          {labels.inputLabel}
        </label>
        <textarea
          id={inputId}
          className="ua-parser-tool__textarea ua-parser-tool__textarea--manual"
          value={manualInput}
          onChange={(event) => setManualInput(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={8}
        />
        <div className="ua-parser-tool__actions">
          <button
            type="button"
            className="ua-parser-tool__parse-btn"
            onClick={onParse}
            disabled={!manualInput.trim()}
          >
            {labels.parseButton}
          </button>
        </div>

        {manualParsed ? (
          <ResultsPanel labels={labels} parsed={manualParsed} title={labels.resultsTitle} />
        ) : null}
      </section>
    </div>
  );
}
