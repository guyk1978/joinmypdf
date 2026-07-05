"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  buildGenerateFaviconHeaderSnippet,
  deriveFaviconAssetPath,
  normalizeFaviconText,
} from "@/lib/generate-favicon";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";
import { toolPrimaryBtn } from "@/lib/tool-ui";

export type GenerateFaviconHeaderCodeLabels = {
  headerCodeTitle: string;
  headerCodeHint: string;
  iconPathLabel: string;
  iconPathPlaceholder: string;
  copyHeaderCode: string;
  copiedHeaderCode: string;
  copyHeaderCodeFailed: string;
};

type GenerateFaviconHeaderCodeProps = {
  faviconText: string;
  format: "png" | "ico";
  labels: GenerateFaviconHeaderCodeLabels;
};

export function GenerateFaviconHeaderCode({
  faviconText,
  format,
  labels,
}: GenerateFaviconHeaderCodeProps) {
  const pathTouchedRef = useRef(false);
  const [iconPath, setIconPath] = useState(() => deriveFaviconAssetPath(faviconText, format));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    if (pathTouchedRef.current) return;
    setIconPath(deriveFaviconAssetPath(faviconText, format));
  }, [faviconText, format]);

  const snippet = useMemo(
    () => buildGenerateFaviconHeaderSnippet(iconPath, format),
    [iconPath, format],
  );

  const hasText = Boolean(normalizeFaviconText(faviconText));

  const handleCopy = async () => {
    setCopyError("");
    const success = await copyTextToClipboard(snippet);
    if (!success) {
      setCopyError(labels.copyHeaderCodeFailed);
      setCopied(false);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="generate-favicon-tool__header-code tool-workspace-panel"
      aria-labelledby="favicon-header-code-title"
    >
      <div className="generate-favicon-tool__header-code-intro">
        <h2 id="favicon-header-code-title" className="generate-favicon-tool__header-code-heading">
          {labels.headerCodeTitle}
        </h2>
        <p className="generate-favicon-tool__hint">{labels.headerCodeHint}</p>
      </div>

      <div className="generate-favicon-tool__field">
        <label className="generate-favicon-tool__label" htmlFor="favicon-icon-path">
          {labels.iconPathLabel}
        </label>
        <input
          id="favicon-icon-path"
          type="text"
          className="generate-favicon-tool__input"
          value={iconPath}
          onChange={(event) => {
            pathTouchedRef.current = true;
            setCopied(false);
            setCopyError("");
            setIconPath(event.target.value);
          }}
          placeholder={labels.iconPathPlaceholder}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="generate-favicon-tool__header-code-output">
        <textarea
          className="generate-favicon-tool__header-code-snippet"
          readOnly
          value={snippet}
          rows={3}
          aria-label={labels.headerCodeTitle}
        />
        <button
          type="button"
          className={`generate-favicon-tool__header-code-copy ${toolPrimaryBtn}`}
          disabled={!hasText}
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {copied ? labels.copiedHeaderCode : labels.copyHeaderCode}
        </button>
      </div>

      {copyError ? (
        <p className="generate-favicon-tool__error" role="alert">
          {copyError}
        </p>
      ) : null}
    </section>
  );
}
