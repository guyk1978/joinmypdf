"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { Braces, Check, Copy, Eraser, ScanSearch } from "lucide-react";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import {
  copyTextToClipboard,
  formatExpirationRelative,
  getExpirationInfo,
  isTokenExpired,
  parseJwtToken,
  type JwtParseSuccess,
  type JwtWarningType,
  type SignatureStatus,
} from "@/lib/jwt-debugger";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";

export type JWTDebuggerLabels = {
  privacyNotice: string;
  inputLabel: string;
  inputHint: string;
  inputPlaceholder: string;
  decodeButton: string;
  clearButton: string;
  resultsTitle: string;
  headerTitle: string;
  payloadTitle: string;
  signatureTitle: string;
  algorithmLabel: string;
  typeLabel: string;
  statusLabel: string;
  signaturePresent: string;
  signatureMissing: string;
  signatureMalformed: string;
  signatureAlgNone: string;
  signatureNote: string;
  copyJsonButton: string;
  copied: string;
  copyFailed: string;
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
  actions,
  children,
  alert,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  alert?: boolean;
}) {
  return (
    <article
      className={clsx(
        "space-y-3 border border-neutral-800 bg-neutral-950/80 p-3",
        alert && "border-amber-800/70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h3>
        {actions}
      </div>
      <div className="space-y-3">{children}</div>
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

function signatureStatusLabel(status: SignatureStatus, labels: JWTDebuggerLabels): string {
  switch (status) {
    case "present":
      return labels.signaturePresent;
    case "missing":
      return labels.signatureMissing;
    case "malformed":
      return labels.signatureMalformed;
    case "alg_none":
      return labels.signatureAlgNone;
    default:
      return labels.signatureMissing;
  }
}

function ParsedDashboard({
  labels,
  parsed,
  locale,
  copied,
  copyError,
  onCopyPayload,
}: {
  labels: JWTDebuggerLabels;
  parsed: JwtParseSuccess;
  locale: string;
  copied: boolean;
  copyError: string;
  onCopyPayload: () => void;
}) {
  const expiration = getExpirationInfo(parsed.exp);
  const relativeExpiration =
    expiration.hasExp && expiration.expMs
      ? formatExpirationRelative(expiration.expMs, Date.now(), locale, expiration.isExpired)
      : null;
  const expired = isTokenExpired(parsed.warnings);
  const signatureAlert =
    parsed.signatureStatus === "missing" ||
    parsed.signatureStatus === "malformed" ||
    parsed.signatureStatus === "alg_none";

  return (
    <div className="space-y-4">
      {parsed.warnings.length > 0 ? (
        <ul className="space-y-2" aria-live="polite">
          {parsed.warnings.map((warning) => (
            <li
              key={warning.type}
              className={clsx(
                "border px-3 py-2 text-sm",
                warning.type === "expired" ||
                  warning.type === "signature_malformed" ||
                  warning.type === "alg_none"
                  ? "border-amber-800/70 bg-amber-950/40 text-amber-200"
                  : "border-neutral-800 bg-neutral-950/60 text-neutral-300",
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
            "border px-3 py-2 text-sm",
            expired
              ? "border-amber-800/70 bg-amber-950/40 text-amber-200"
              : "border-neutral-800 bg-neutral-950/60 text-neutral-300",
          )}
        >
          <span className="font-semibold text-neutral-200">{labels.expirationTitle}: </span>
          <span>{relativeExpiration}</span>
          {expiration.absolute ? (
            <span className="mt-1 block text-xs text-neutral-500">
              {labels.expirationAbsolute.replace("{date}", expiration.absolute)}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">{labels.expirationNone}</p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ResultCard title={labels.headerTitle}>
          <ResultField label={labels.algorithmLabel} value={parsed.algorithm} />
          <ResultField label={labels.typeLabel} value={parsed.tokenType} />
          <pre className="overflow-x-auto whitespace-pre-wrap break-words border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
            {parsed.header.formatted}
          </pre>
        </ResultCard>

        <ResultCard
          title={labels.payloadTitle}
          alert={expired}
          actions={
            <button
              type="button"
              className={clsx(toolOutlineBtn, copied && "border-emerald-700 text-emerald-300")}
              onClick={onCopyPayload}
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
          }
        >
          {copyError ? (
            <p className="text-sm text-amber-400" role="status">
              {copyError}
            </p>
          ) : null}
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
            {parsed.payload.formatted}
          </pre>
        </ResultCard>

        <ResultCard title={labels.signatureTitle} alert={signatureAlert}>
          <ResultField
            label={labels.statusLabel}
            value={signatureStatusLabel(parsed.signatureStatus, labels)}
          />
          <p className="text-xs leading-relaxed text-neutral-500">{labels.signatureNote}</p>
          {parsed.signature.raw ? (
            <pre className="overflow-x-auto whitespace-pre-wrap break-all border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-400">
              {parsed.signature.raw}
            </pre>
          ) : null}
        </ResultCard>
      </div>
    </div>
  );
}

export function JWTDebugger({ labels, className }: JWTDebuggerProps) {
  const locale = useLocale();
  const inputId = useId();
  const [token, setToken] = useState("");
  const [parsed, setParsed] = useState<JwtParseSuccess | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const onDecode = useCallback(() => {
    const result = parseJwtToken(token);
    if (!result.ok) {
      setParsed(null);
      setError(parseErrorMessage(result.error, labels));
      return;
    }
    setError("");
    setCopyError("");
    setParsed(result);
  }, [labels, token]);

  const onClear = useCallback(() => {
    setToken("");
    setParsed(null);
    setError("");
    setCopyError("");
    setCopied(false);
  }, []);

  const onCopyPayload = useCallback(async () => {
    if (!parsed) return;
    const success = await copyTextToClipboard(parsed.payload.formatted);
    if (!success) {
      setCopyError(labels.copyFailed);
      return;
    }
    setCopyError("");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [labels.copyFailed, parsed]);

  return (
    <div className={clsx("jwt-debugger-tool im-dev-tool", className)}>
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
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setError("");
            }}
            placeholder={labels.inputPlaceholder}
            spellCheck={false}
            rows={8}
          />
        </div>

        <div className="im-dev-tool__actions">
          <button type="button" className={toolPrimaryBtn} onClick={onDecode}>
            <ScanSearch className="mr-2 inline h-4 w-4" aria-hidden />
            {labels.decodeButton}
          </button>
          <button type="button" className={toolOutlineBtn} onClick={onClear} disabled={!token && !parsed}>
            <Eraser className="mr-2 inline h-4 w-4" aria-hidden />
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
          <div className="im-dev-tool__results-head">
            <Braces className="h-4 w-4 text-neutral-500" aria-hidden />
            <h2 className="im-dev-tool__section-title">{labels.resultsTitle}</h2>
          </div>

          <ParsedDashboard
            labels={labels}
            parsed={parsed}
            locale={locale}
            copied={copied}
            copyError={copyError}
            onCopyPayload={() => void onCopyPayload()}
          />

          <PostSuccessUpsell operation="jwt-debugger" fileContext={parsed.algorithm} />
        </div>
      ) : null}
    </div>
  );
}
