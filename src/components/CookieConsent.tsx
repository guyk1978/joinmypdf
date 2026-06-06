"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import {
  disableGoogleAnalytics,
  enableGoogleAnalytics,
  isGoogleAnalyticsConfigured,
} from "@/lib/google-analytics";

type ConsentUiState = "checking" | "pending" | CookieConsentChoice;

export function CookieConsent() {
  const t = useTranslations("CookieConsent");
  const [uiState, setUiState] = useState<ConsentUiState>("checking");

  useEffect(() => {
    if (!isGoogleAnalyticsConfigured()) {
      setUiState("declined");
      return;
    }

    const stored = getCookieConsent();
    if (stored === "accepted") {
      enableGoogleAnalytics();
      setUiState("accepted");
      return;
    }
    if (stored === "declined") {
      setUiState("declined");
      return;
    }

    setUiState("pending");
  }, []);

  if (uiState !== "pending") return null;

  const persist = (choice: CookieConsentChoice) => {
    setCookieConsent(choice);
    if (choice === "accepted") {
      enableGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }
    setUiState(choice);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] p-4 sm:p-5"
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 dark:border-cyan-300/30 dark:bg-[#0B132B]/82 dark:shadow-[0_0_32px_-12px_rgba(100,200,255,0.28)]">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("message")}{" "}
          <Link href="/privacy/" className="font-medium text-cyan-700 underline-offset-2 hover:underline dark:text-cyan-300">
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => persist("declined")}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => persist("accepted")}
            className="inline-flex items-center justify-center rounded-xl border border-cyan-400/50 bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_14px_-4px_rgba(100,200,255,0.45)] transition hover:border-cyan-300/70 hover:bg-[#262626] dark:border-cyan-300/50 dark:bg-white/[0.06] dark:hover:bg-white/[0.09] dark:hover:shadow-[0_0_18px_-4px_rgba(100,200,255,0.55)]"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
