"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { decodeSslCertificate, type SslFieldLabels } from "@/lib/ssl-decoder";

export type SslDecoderLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  decodeButton: string;
  clearButton: string;
  resultsTitle: string;
  emptyHint: string;
  errorEmpty: string;
  errorInvalid: string;
  errorParse: string;
  privacyLabel: string;
  fieldLabels: SslFieldLabels;
  colField: string;
  colValue: string;
};

type SslDecoderProps = {
  labels: SslDecoderLabels;
  className?: string;
};

export function SslDecoder({ labels, className }: SslDecoderProps) {
  const inputId = useId();
  const [pem, setPem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<ReturnType<typeof decodeSslCertificate> | null>(null);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (error === "empty") return labels.errorEmpty;
    if (error === "invalid") return labels.errorInvalid;
    return labels.errorParse;
  }, [error, labels.errorEmpty, labels.errorInvalid, labels.errorParse]);

  const handleDecode = () => {
    const result = decodeSslCertificate(pem, labels.fieldLabels);
    if (!result.ok) {
      setDecoded(null);
      setError(result.code);
      return;
    }
    setError(null);
    setDecoded(result);
  };

  const handleClear = () => {
    setPem("");
    setError(null);
    setDecoded(null);
  };

  return (
    <div className={clsx("ssl-decoder-tool im-dev-tool", className)}>
      <div className="security-tool__pane tool-workspace-panel im-dev-tool__panel">
        <label htmlFor={inputId} className="security-tool__label">
          {labels.inputLabel}
        </label>
        <textarea
          id={inputId}
          className="security-tool__textarea"
          value={pem}
          onChange={(event) => setPem(event.target.value)}
          placeholder={labels.inputPlaceholder}
          spellCheck={false}
          rows={12}
        />
        <div className="ssl-decoder-tool__actions">
          <button type="button" className="security-tool__action-btn" onClick={handleDecode}>
            {labels.decodeButton}
          </button>
          <button type="button" className="security-tool__copy-btn" onClick={handleClear}>
            {labels.clearButton}
          </button>
        </div>
        <p className="im-dev-tool__privacy security-tool__hint" role="note">
          {labels.privacyLabel}
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {decoded?.ok ? (
        <section
          className="mt-6 overflow-hidden border"
          style={{
            background: "var(--im-tool-control-bg)",
            borderColor: "var(--im-tool-panel-border)",
            borderRadius: "var(--im-tool-radius)",
          }}
          aria-labelledby="ssl-decoder-results"
        >
          <h2
            id="ssl-decoder-results"
            className="border-b px-4 py-3 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            style={{ borderColor: "var(--im-tool-panel-border)" }}
          >
            {labels.resultsTitle}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--im-tool-panel-border)" }}>
                  <th className="px-4 py-3 font-medium text-white">{labels.colField}</th>
                  <th className="px-4 py-3 font-medium text-white">{labels.colValue}</th>
                </tr>
              </thead>
              <tbody>
                {decoded.result.fields.map((field) => (
                  <tr key={field.key} className="border-b border-[#1a1a1a] last:border-b-0">
                    <td className="px-4 py-3 align-top font-medium text-white whitespace-nowrap">
                      {field.label}
                    </td>
                    <td className="px-4 py-3 align-top break-all font-mono text-xs text-[#d4d4d4] md:text-sm">
                      {field.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : !errorMessage ? (
        <p className="mt-4 text-sm text-[#737373]">{labels.emptyHint}</p>
      ) : null}
    </div>
  );
}
