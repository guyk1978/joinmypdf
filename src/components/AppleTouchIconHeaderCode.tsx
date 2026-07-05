"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";
import {
  buildAppleTouchIconHeaderSnippet,
  deriveAppleTouchIconAssetPath,
  type AppleTouchIconSize,
} from "@/lib/apple-touch-icon";
import { imBtnCta } from "@/lib/design-system";

export type AppleTouchIconHeaderCodeLabels = {
  title: string;
  hint: string;
  iconPathLabel: string;
  iconPathPlaceholder: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
};

type AppleTouchIconHeaderCodeProps = {
  outputFilename: string;
  selectedSizes: AppleTouchIconSize[];
  labels: AppleTouchIconHeaderCodeLabels;
};

export function AppleTouchIconHeaderCode({
  outputFilename,
  selectedSizes,
  labels,
}: AppleTouchIconHeaderCodeProps) {
  const pathTouchedRef = useRef(false);
  const [iconPath, setIconPath] = useState(() => deriveAppleTouchIconAssetPath(outputFilename));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    if (pathTouchedRef.current) return;
    setIconPath(deriveAppleTouchIconAssetPath(outputFilename));
  }, [outputFilename]);

  const snippet = useMemo(
    () => buildAppleTouchIconHeaderSnippet(iconPath, selectedSizes),
    [iconPath, selectedSizes],
  );

  const handleCopy = async () => {
    setCopyError("");
    const success = await copyTextToClipboard(snippet);
    if (!success) {
      setCopyError(labels.copyHtmlCodeFailed);
      setCopied(false);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = snippet.split("\n").length;

  return (
    <section
      className="png-to-ico-tool__header-code tool-workspace-panel apple-touch-icon-tool__header-code"
      aria-labelledby="apple-touch-icon-header-code-title"
    >
      <div className="png-to-ico-tool__header-code-intro">
        <h2 id="apple-touch-icon-header-code-title" className="png-to-ico-tool__header-code-heading">
          {labels.title}
        </h2>
        <p className="crop-image-tool__meta">{labels.hint}</p>
      </div>

      <div className="png-to-ico-tool__header-code-field">
        <label className="png-to-ico-tool__header-code-label" htmlFor="apple-touch-icon-path">
          {labels.iconPathLabel}
        </label>
        <input
          id="apple-touch-icon-path"
          type="text"
          className="crop-image-tool__input"
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

      <div className="png-to-ico-tool__header-code-output">
        <textarea
          className="png-to-ico-tool__header-code-snippet"
          readOnly
          value={snippet}
          rows={Math.max(2, lineCount)}
          aria-label={labels.title}
        />
        <button type="button" className={imBtnCta} onClick={() => void handleCopy()}>
          {copied ? (
            <Check className="png-to-ico-tool__header-code-copy-icon" aria-hidden />
          ) : (
            <Copy className="png-to-ico-tool__header-code-copy-icon" aria-hidden />
          )}
          {copied ? labels.copiedHtmlCode : labels.copyHtmlCode}
        </button>
      </div>

      {copyError ? (
        <p className="crop-image-tool__error" role="alert">
          {copyError}
        </p>
      ) : null}
    </section>
  );
}
