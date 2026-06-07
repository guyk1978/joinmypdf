"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { isGoogleAnalyticsConfigured, updateConsent } from "@/lib/google-analytics";

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
    updateConsent(choice === "accepted");
    setUiState(choice);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] p-3"
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-3 rounded-none border border-neutral-300 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm leading-relaxed text-black dark:text-neutral-200">
          {t("message")}{" "}
          <Link
            href="/privacy/"
            className="font-medium text-black underline underline-offset-2 hover:text-black dark:text-neutral-200 dark:hover:text-neutral-100"
          >
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => persist("declined")}
            className="inline-flex items-center justify-center rounded-none border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => persist("accepted")}
            className="inline-flex items-center justify-center rounded-none border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800 dark:border-neutral-500 dark:bg-neutral-200 dark:text-neutral-950 dark:hover:bg-white"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
