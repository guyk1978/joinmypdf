"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";
import { buildSvgToFaviconHeaderSnippet, deriveSvgToFaviconAssetPath } from "@/lib/svg-to-favicon";
import { imBtnCta } from "@/lib/design-system";

export type SvgToFaviconHeaderCodeLabels = {
  title: string;
  hint: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
};

type SvgToFaviconHeaderCodeProps = {
  outputFilename: string;
  labels: SvgToFaviconHeaderCodeLabels;
};

export function SvgToFaviconHeaderCode({ outputFilename, labels }: SvgToFaviconHeaderCodeProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const snippet = useMemo(() => {
    const iconPath = deriveSvgToFaviconAssetPath(outputFilename);
    return buildSvgToFaviconHeaderSnippet(iconPath);
  }, [outputFilename]);

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
      aria-labelledby="svg-to-favicon-header-code-title"
    >
      <div className="png-to-ico-tool__header-code-intro">
        <h2 id="svg-to-favicon-header-code-title" className="png-to-ico-tool__header-code-heading">
          {labels.title}
        </h2>
        <p className="crop-image-tool__meta">{labels.hint}</p>
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
