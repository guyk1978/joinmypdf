"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";
import { buildPngToIcoHeaderSnippet, derivePngToIcoAssetPath } from "@/lib/png-to-ico";
import { imBtnCta } from "@/lib/design-system";

export type PngToIcoHeaderCodeLabels = {
  title: string;
  hint: string;
  iconPathLabel: string;
  iconPathPlaceholder: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
};

type PngToIcoHeaderCodeProps = {
  outputFilename: string;
  labels: PngToIcoHeaderCodeLabels;
};

export function PngToIcoHeaderCode({ outputFilename, labels }: PngToIcoHeaderCodeProps) {
  const pathTouchedRef = useRef(false);
  const [iconPath, setIconPath] = useState(() => derivePngToIcoAssetPath(outputFilename));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    if (pathTouchedRef.current) return;
    setIconPath(derivePngToIcoAssetPath(outputFilename));
  }, [outputFilename]);

  const snippet = useMemo(() => buildPngToIcoHeaderSnippet(iconPath), [iconPath]);

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

  return (
    <section
      className="png-to-ico-tool__header-code tool-workspace-panel"
      aria-labelledby="png-to-ico-header-code-title"
    >
      <div className="png-to-ico-tool__header-code-intro">
        <h2 id="png-to-ico-header-code-title" className="png-to-ico-tool__header-code-heading">
          {labels.title}
        </h2>
        <p className="crop-image-tool__meta">{labels.hint}</p>
      </div>

      <div className="png-to-ico-tool__header-code-field">
        <label className="png-to-ico-tool__header-code-label" htmlFor="png-to-ico-icon-path">
          {labels.iconPathLabel}
        </label>
        <input
          id="png-to-ico-icon-path"
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
          rows={2}
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
