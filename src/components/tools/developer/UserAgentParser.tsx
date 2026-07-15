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
    <div className={clsx("ua-parser-tool space-y-4", className)}>
      <div
        className="rounded-none border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200/90"
        role="note"
      >
        {labels.privacyNotice}
      </div>

      <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300" htmlFor={inputId}>
            {labels.inputLabel}
          </label>
          <p className="text-xs text-neutral-500">{labels.inputHint}</p>
          <textarea
            id={inputId}
            className="min-h-28 w-full resize-y border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus-visible:border-neutral-500"
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

        <div className="flex flex-wrap gap-2">
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
          <p className="text-sm text-amber-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {parsed ? (
        <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              {labels.resultsTitle}
            </h2>
            <button
              type="button"
              className={clsx(toolOutlineBtn, copied && "border-emerald-700 text-emerald-300")}
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
            <p className="text-sm text-amber-400" role="status">
              {copyError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
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

          {parsed ? (
            <PostSuccessUpsell
              operation="user-agent-parser"
              fileContext={parsed.browser.name}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
