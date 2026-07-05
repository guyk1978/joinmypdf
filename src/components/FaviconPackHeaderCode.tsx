"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";
import { buildFaviconPackHeaderSnippet } from "@/lib/favicon-pack";
import { imBtnCta } from "@/lib/design-system";

export type FaviconPackHeaderCodeLabels = {
  title: string;
  hint: string;
  copyHtmlCode: string;
  copiedHtmlCode: string;
  copyHtmlCodeFailed: string;
};

type FaviconPackHeaderCodeProps = {
  labels: FaviconPackHeaderCodeLabels;
};

export function FaviconPackHeaderCode({ labels }: FaviconPackHeaderCodeProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const snippet = useMemo(() => buildFaviconPackHeaderSnippet(), []);

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
      className="png-to-ico-tool__header-code tool-workspace-panel favicon-pack-tool__header-code"
      aria-labelledby="favicon-pack-header-code-title"
    >
      <div className="png-to-ico-tool__header-code-intro">
        <h2 id="favicon-pack-header-code-title" className="png-to-ico-tool__header-code-heading">
          {labels.title}
        </h2>
        <p className="crop-image-tool__meta">{labels.hint}</p>
      </div>

      <div className="png-to-ico-tool__header-code-output">
        <textarea
          className="png-to-ico-tool__header-code-snippet"
          readOnly
          value={snippet}
          rows={Math.max(6, lineCount)}
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
