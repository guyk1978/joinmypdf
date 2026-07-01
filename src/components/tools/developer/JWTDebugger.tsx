"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import {
  copyTextToClipboard,
  formatExpirationRelative,
  getExpirationInfo,
  hasSignatureIssue,
  isTokenExpired,
  parseJwtToken,
  type JwtParseResult,
  type JwtWarningType,
} from "@/lib/jwt-debugger";

export type JWTDebuggerLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  clearButton: string;
  headerTitle: string;
  payloadTitle: string;
  signatureTitle: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  outputEmpty: string;
  expirationTitle: string;
  expirationNone: string;
  expirationAbsolute: string;
  warningExpired: string;
  warningSignatureMalformed: string;
  warningSignatureUnverified: string;
  warningAlgNone: string;
  errorEmpty: string;
  errorStructure: string;
  errorInvalid: string;
  errorHeader: string;
  errorPayload: string;
};

type JWTDebuggerProps = {
  labels: JWTDebuggerLabels;
  className?: string;
};

type SectionCardProps = {
  title: string;
  tone: "header" | "payload" | "signature";
  value: string;
  formatted?: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  highlighted?: boolean;
};

function SectionCard({
  title,
  tone,
  value,
  formatted,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
  highlighted,
}: SectionCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const onCopy = async (text: string) => {
    const success = await copyTextToClipboard(text);
    if (!success) {
      setCopyError(copyFailedLabel);
      return;
    }

    setCopyError(null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article
      className={clsx(
        "jwt-debugger-tool__card",
        `jwt-debugger-tool__card--${tone}`,
        highlighted && "jwt-debugger-tool__card--alert",
      )}
    >
      <div className="jwt-debugger-tool__card-header">
        <h3 className="jwt-debugger-tool__card-title">{title}</h3>
        <button
          type="button"
          className={clsx("jwt-debugger-tool__copy-btn", copied && "jwt-debugger-tool__copy-btn--copied")}
          onClick={() => void onCopy(formatted ?? value)}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      {copyError ? (
        <p className="jwt-debugger-tool__error" role="status">
          {copyError}
        </p>
      ) : null}
      {formatted ? (
        <pre className="jwt-debugger-tool__json">{formatted}</pre>
      ) : (
        <pre className="jwt-debugger-tool__raw">{value}</pre>
      )}
    </article>
  );
}

function warningMessage(type: JwtWarningType, labels: JWTDebuggerLabels): string {
  switch (type) {
    case "expired":
      return labels.warningExpired;
    case "signature_malformed":
      return labels.warningSignatureMalformed;
    case "signature_unverified":
      return labels.warningSignatureUnverified;
    case "alg_none":
      return labels.warningAlgNone;
    default:
      return "";
  }
}

function parseErrorMessage(error: string, labels: JWTDebuggerLabels): string {
  switch (error) {
    case "empty":
      return labels.errorEmpty;
    case "structure":
      return labels.errorStructure;
    case "invalid":
      return labels.errorInvalid;
    case "header":
      return labels.errorHeader;
    case "payload":
      return labels.errorPayload;
    default:
      return labels.errorInvalid;
  }
}

type ParsedViewProps = {
  labels: JWTDebuggerLabels;
  parsed: Extract<JwtParseResult, { ok: true }>;
  locale: string;
};

function ParsedView({ labels, parsed, locale }: ParsedViewProps) {
  const expiration = getExpirationInfo(parsed.exp);
  const relativeExpiration =
    expiration.hasExp && expiration.expMs
      ? formatExpirationRelative(expiration.expMs, Date.now(), locale, expiration.isExpired)
      : null;

  const signatureAlert = hasSignatureIssue(parsed.warnings);
  const expired = isTokenExpired(parsed.warnings);

  return (
    <div className="jwt-debugger-tool__parsed">
      {parsed.warnings.length > 0 ? (
        <ul className="jwt-debugger-tool__warnings" aria-live="polite">
          {parsed.warnings.map((warning) => (
            <li
              key={warning.type}
              className={clsx(
                "jwt-debugger-tool__warning",
                (warning.type === "expired" || warning.type === "signature_malformed" || warning.type === "alg_none") &&
                  "jwt-debugger-tool__warning--critical",
              )}
            >
              {warningMessage(warning.type, labels)}
            </li>
          ))}
        </ul>
      ) : null}

      {expiration.hasExp ? (
        <div
          className={clsx(
            "jwt-debugger-tool__expiration",
            expired && "jwt-debugger-tool__expiration--expired",
          )}
        >
          <span className="jwt-debugger-tool__expiration-label">{labels.expirationTitle}</span>
          <span className="jwt-debugger-tool__expiration-relative">{relativeExpiration}</span>
          {expiration.absolute ? (
            <span className="jwt-debugger-tool__expiration-absolute">
              {labels.expirationAbsolute.replace("{date}", expiration.absolute)}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="jwt-debugger-tool__expiration-none">{labels.expirationNone}</p>
      )}

      <div className="jwt-debugger-tool__sections">
        <SectionCard
          title={labels.headerTitle}
          tone="header"
          value={parsed.header.raw}
          formatted={parsed.header.formatted}
          copyLabel={labels.copyButton}
          copiedLabel={labels.copied}
          copyFailedLabel={labels.copyFailed}
        />
        <SectionCard
          title={labels.payloadTitle}
          tone="payload"
          value={parsed.payload.raw}
          formatted={parsed.payload.formatted}
          copyLabel={labels.copyButton}
          copiedLabel={labels.copied}
          copyFailedLabel={labels.copyFailed}
          highlighted={expired}
        />
        <SectionCard
          title={labels.signatureTitle}
          tone="signature"
          value={parsed.signature.raw}
          copyLabel={labels.copyButton}
          copiedLabel={labels.copied}
          copyFailedLabel={labels.copyFailed}
          highlighted={signatureAlert}
        />
      </div>
    </div>
  );
}

export function JWTDebugger({ labels, className }: JWTDebuggerProps) {
  const locale = useLocale();
  const inputId = useId();
  const [token, setToken] = useState("");
  const [parsed, setParsed] = useState<JwtParseResult | null>(null);

  useEffect(() => {
    if (!token.trim()) {
      setParsed(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setParsed(parseJwtToken(token));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [token]);

  const parseError = parsed && !parsed.ok ? parseErrorMessage(parsed.error, labels) : null;

  return (
    <div className={clsx("jwt-debugger-tool", className)}>
      <section className="jwt-debugger-tool__input tool-workspace-panel" aria-labelledby="jwt-debugger-input">
        <div className="jwt-debugger-tool__input-header">
          <h2 id="jwt-debugger-input" className="jwt-debugger-tool__section-title">
            {labels.inputLabel}
          </h2>
          <button
            type="button"
            className="jwt-debugger-tool__clear-btn"
            onClick={() => setToken("")}
            disabled={!token}
          >
            {labels.clearButton}
          </button>
        </div>
        <textarea
          id={inputId}
          className="jwt-debugger-tool__textarea"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={6}
        />
      </section>

      <section className="jwt-debugger-tool__output tool-workspace-panel" aria-live="polite">
        {!token.trim() ? (
          <p className="jwt-debugger-tool__empty">{labels.outputEmpty}</p>
        ) : null}
        {parseError ? (
          <p className="jwt-debugger-tool__parse-error" role="alert">
            {parseError}
          </p>
        ) : null}
        {parsed?.ok ? <ParsedView labels={labels} parsed={parsed} locale={locale} /> : null}
      </section>
    </div>
  );
}
