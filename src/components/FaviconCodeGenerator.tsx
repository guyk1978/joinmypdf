"use client";

import { clsx } from "clsx";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { imBtnCta } from "@/lib/design-system";
import {
  buildFaviconHtmlSnippet,
  copyTextToClipboard,
  DEFAULT_FAVICON_PATH,
  tokenizeFaviconHtmlLine,
} from "@/lib/favicon-code-generator";

export type FaviconCodeGeneratorLabels = {
  instructions: string;
  pathLabel: string;
  pathPlaceholder: string;
  pathHint: string;
  codeLabel: string;
  copyCode: string;
  copied: string;
  copyFailed: string;
};

export type FaviconCodeGeneratorProps = {
  labels: FaviconCodeGeneratorLabels;
  className?: string;
};

function FaviconCodeBlock({ code }: { code: string }) {
  const lines = code.split("\n");

  return (
    <pre className="favicon-code-generator-tool__code">
      <code>
        {lines.map((line, index) => (
          <span key={`${index}-${line}`} className="favicon-code-generator-tool__code-line">
            {tokenizeFaviconHtmlLine(line).map((token, tokenIndex) => (
              <span
                key={`${index}-${tokenIndex}`}
                className={clsx(
                  token.kind === "tag" && "favicon-code-generator-tool__token--tag",
                  token.kind === "attr" && "favicon-code-generator-tool__token--attr",
                  token.kind === "value" && "favicon-code-generator-tool__token--value",
                )}
              >
                {token.text}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
}

export function FaviconCodeGenerator({ labels, className }: FaviconCodeGeneratorProps) {
  const [faviconPath, setFaviconPath] = useState(DEFAULT_FAVICON_PATH);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const snippet = useMemo(() => buildFaviconHtmlSnippet(faviconPath), [faviconPath]);

  const handleCopy = async () => {
    setCopyError("");
    const success = await copyTextToClipboard(snippet);
    if (!success) {
      setCopyError(labels.copyFailed);
      setCopied(false);
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={clsx("favicon-code-generator-tool", className)}>
      <p className="favicon-code-generator-tool__instructions">{labels.instructions}</p>

      <div className="favicon-code-generator-tool__field tool-workspace-panel">
        <label htmlFor="favicon-code-path" className="favicon-code-generator-tool__label">
          {labels.pathLabel}
        </label>
        <input
          id="favicon-code-path"
          type="text"
          className="favicon-code-generator-tool__input"
          value={faviconPath}
          onChange={(event) => {
            setCopied(false);
            setCopyError("");
            setFaviconPath(event.target.value);
          }}
          placeholder={labels.pathPlaceholder}
          spellCheck={false}
          autoComplete="off"
        />
        <p className="favicon-code-generator-tool__hint">{labels.pathHint}</p>
      </div>

      <div className="favicon-code-generator-tool__output tool-workspace-panel">
        <div className="favicon-code-generator-tool__output-header">
          <span className="favicon-code-generator-tool__label">{labels.codeLabel}</span>
          <button
            type="button"
            className={clsx(
              imBtnCta,
              "favicon-code-generator-tool__copy-btn",
              copied && "favicon-code-generator-tool__copy-btn--copied",
            )}
            onClick={() => void handleCopy()}
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? labels.copied : labels.copyCode}
          </button>
        </div>

        <FaviconCodeBlock code={snippet} />
      </div>

      {copyError ? (
        <p className="crop-image-tool__error" role="alert">
          {copyError}
        </p>
      ) : null}
    </div>
  );
}
