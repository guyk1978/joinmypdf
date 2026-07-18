"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

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

export type PageSharePayload = {
  title?: string;
  text?: string;
  url?: string;
};

export function usePageShare(payload?: PageSharePayload) {
  const t = useTranslations("Share");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const flashCopied = useCallback(() => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    if (busy) return;
    const url = payload?.url ?? window.location.href;
    const title = payload?.title || document.title || t("brandFallback");
    const text = payload?.text || t("shareText");

    setBusy(true);
    try {
      if (canNativeShare()) {
        await navigator.share({ title, text, url });
        return;
      }

      const ok = await copyToClipboard(url);
      if (ok) flashCopied();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const ok = await copyToClipboard(url);
      if (ok) flashCopied();
    } finally {
      setBusy(false);
    }
  }, [busy, flashCopied, payload?.text, payload?.title, payload?.url, t]);

  const ariaLabel = copied ? t("linkCopied") : busy ? t("sharing") : t("shareThisPage");
  const title = copied ? t("linkCopied") : busy ? t("sharing") : t("share");
  const linkCopiedLabel = t("linkCopied");

  return { handleShare, copied, busy, ariaLabel, title, linkCopiedLabel };
}
