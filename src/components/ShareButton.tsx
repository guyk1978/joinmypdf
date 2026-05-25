"use client";

import { useCallback, useEffect, useState } from "react";

type ShareButtonProps = {
  className?: string;
};

function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }

  try {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

export function ShareButton({ className = "" }: ShareButtonProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("JoinMyPDF");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.href);
    setShareTitle(document.title || "JoinMyPDF");
  }, []);

  const flashCopied = useCallback(() => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    if (busy) return;
    const url = window.location.href;
    const title = document.title || "JoinMyPDF";
    const text = "Private PDF tools & invoice templates — processed in your browser.";

    setBusy(true);
    try {
      if (canNativeShare()) {
        await navigator.share({ title, text, url });
        return;
      }

      const ok = await copyToClipboard(url);
      if (ok) {
        flashCopied();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const ok = await copyToClipboard(url);
      if (ok) flashCopied();
    } finally {
      setBusy(false);
    }
  }, [busy, flashCopied]);

  const label = copied ? "Copied!" : busy ? "Sharing…" : "Share";

  return (
    <div
      className={`share-button-root fixed z-40 flex flex-col items-end gap-2 ${className}`.trim()}
      style={{
        right: "max(0.75rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={busy || !shareUrl}
        className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface/90 px-4 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-black/30 backdrop-blur-md transition hover:border-brand/45 hover:bg-surface-muted/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={copied ? "Link copied to clipboard" : "Share this page"}
        title={shareUrl || "Share this page"}
      >
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
            copied
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
              : "border-brand/35 bg-brand/10 text-brand group-hover:bg-brand/20"
          }`}
          aria-hidden="true"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l4 4L19 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 16V4m0 0l-4 4m4-4l4 4M5 20h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className={copied ? "text-emerald-300 transition-colors" : "transition-colors"}>
          {label}
        </span>
      </button>
      {shareTitle && shareUrl ? (
        <p className="max-w-[11rem] truncate text-right text-[0.65rem] text-ink-muted/80" aria-hidden="true">
          {shareTitle}
        </p>
      ) : null}
    </div>
  );
}
