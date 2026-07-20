"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, Copy, ScanSearch } from "lucide-react";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import {
  copyTextToClipboard,
  getNavigatorUserAgent,
  parseUserAgent,
  parsedUserAgentToJson,
  type ParsedUserAgent,
} from "@/lib/user-agent-parser";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

export type UserAgentParserLabels = {
  privacyNotice: string;
  inputLabel: string;
  inputHint: string;
  inputPlaceholder: string;
  parseButton: string;
  useCurrentButton: string;
  clearButton: string;
  resultsTitle: string;
  browserSection: string;
  osSection: string;
  deviceSection: string;
  engineSection: string;
  nameLabel: string;
  versionLabel: string;
  typeLabel: string;
  copyJsonButton: string;
  copied: string;
  copyFailed: string;
  emptyError: string;
};

type UserAgentParserProps = {
  labels: UserAgentParserLabels;
  className?: string;
};

function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="break-words font-mono text-sm text-neutral-100">{value}</p>
    </div>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="space-y-3 border border-neutral-800 bg-neutral-950/80 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h3>
      <div className="space-y-3">{children}</div>
    </article>
  );
}

export function UserAgentParser({ labels, className }: UserAgentParserProps) {
  const inputId = useId();
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedUserAgent | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    const current = getNavigatorUserAgent();
    if (!current) return;
    setInput(current);
  }, []);

  const onParse = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setParsed(null);
      setError(labels.emptyError);
      return;
    }
    setError("");
    setCopyError("");
    setParsed(parseUserAgent(trimmed));
  }, [input, labels.emptyError]);

  const onUseCurrent = useCallback(() => {
    const current = getNavigatorUserAgent();
    setInput(current);
    setError("");
    if (current.trim()) {
      setParsed(parseUserAgent(current));
    }
  }, []);

  const onCopyJson = useCallback(async () => {
    if (!parsed) return;
    const success = await copyTextToClipboard(parsedUserAgentToJson(parsed));
    if (!success) {
      setCopyError(labels.copyFailed);
      return;
    }
    setCopyError("");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [labels.copyFailed, parsed]);

  return (
    <div className={clsx("ua-parser-tool im-dev-tool", className)}>
      <div className="im-dev-tool__panel">
        <div className="im-dev-tool__field">
          <div className="im-dev-tool__field-head">
            <label className="im-dev-tool__label" htmlFor={inputId}>
              {labels.inputLabel}
            </label>
            <p className="im-dev-tool__privacy" role="note">
              {labels.privacyNotice}
            </p>
          </div>
          <textarea
            id={inputId}
            className="im-dev-tool__textarea"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
            }}
            placeholder={labels.inputPlaceholder}
            spellCheck={false}
            rows={5}
          />
        </div>

        <div className="im-dev-tool__actions">
          <button type="button" className={toolPrimaryBtn} onClick={onParse}>
            <ScanSearch className="mr-2 inline h-4 w-4" aria-hidden />
            {labels.parseButton}
          </button>
          <button type="button" className={toolOutlineBtn} onClick={onUseCurrent}>
            {labels.useCurrentButton}
          </button>
          <button
            type="button"
            className={toolOutlineBtn}
            onClick={() => {
              setInput("");
              setParsed(null);
              setError("");
              setCopyError("");
            }}
          >
            {labels.clearButton}
          </button>
        </div>

        {error ? (
          <p className="im-dev-tool__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {parsed ? (
        <div className="im-dev-tool__panel im-dev-tool__panel--results">
          <div className="im-dev-tool__results-head im-dev-tool__results-head--split">
            <h2 className="im-dev-tool__section-title">{labels.resultsTitle}</h2>
            <button
              type="button"
              className={clsx(toolOutlineBtn, copied && "border-neutral-500 text-neutral-200")}
              onClick={() => void onCopyJson()}
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 inline h-4 w-4" aria-hidden />
                  {labels.copied}
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 inline h-4 w-4" aria-hidden />
                  {labels.copyJsonButton}
                </>
              )}
            </button>
          </div>

          {copyError ? (
            <p className="im-dev-tool__error" role="status">
              {copyError}
            </p>
          ) : null}

          <div className="im-dev-tool__cards">
            <ResultCard title={labels.browserSection}>
              <ResultField label={labels.nameLabel} value={parsed.browser.name} />
              <ResultField label={labels.versionLabel} value={parsed.browser.version} />
            </ResultCard>
            <ResultCard title={labels.osSection}>
              <ResultField label={labels.nameLabel} value={parsed.os.name} />
              <ResultField label={labels.versionLabel} value={parsed.os.version} />
            </ResultCard>
            <ResultCard title={labels.deviceSection}>
              <ResultField label={labels.typeLabel} value={parsed.device.type} />
              <ResultField label={labels.nameLabel} value={parsed.device.model} />
            </ResultCard>
            <ResultCard title={labels.engineSection}>
              <ResultField label={labels.nameLabel} value={parsed.engine.name} />
              <ResultField label={labels.versionLabel} value={parsed.engine.version} />
            </ResultCard>
          </div>

          <PostSuccessUpsell
            operation="user-agent-parser"
            fileContext={parsed.browser.name}
          />
        </div>
      ) : null}
    </div>
  );
}
