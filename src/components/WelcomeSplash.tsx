"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { useRouter } from "@/i18n/navigation";
import {
  WELCOME_ENTERED_STORAGE_KEY,
  WELCOME_ENTERED_VALUE,
} from "@/lib/welcome-splash";

type Gate = "show" | "redirecting";

/**
 * Minimal dark welcome screen for the locale root.
 * First visit shows brand + Enter CTA; returning visitors (localStorage) go to /home.
 *
 * Default gate is "show" so SSR HTML includes the LCP hero immediately.
 * Returning visitors are redirected by WelcomeSplashRedirectScript before paint,
 * with this effect as a fallback after hydration.
 */
export function WelcomeSplash() {
  const t = useTranslations("Home.splash");
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("show");

  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELCOME_ENTERED_STORAGE_KEY) === WELCOME_ENTERED_VALUE) {
        setGate("redirecting");
        router.replace("/home");
      }
    } catch {
      /* private mode / blocked storage — keep splash */
    }
  }, [router]);

  const enter = () => {
    try {
      window.localStorage.setItem(WELCOME_ENTERED_STORAGE_KEY, WELCOME_ENTERED_VALUE);
    } catch {
      /* ignore */
    }
    router.push("/home");
  };

  if (gate === "redirecting") {
    return (
      <div
        className="welcome-splash welcome-splash--boot"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">{t("redirecting")}</span>
        <div className="welcome-splash__boot-ring" aria-hidden />
      </div>
    );
  }

  return (
    <div className="welcome-splash">
      <div className="welcome-splash__content">
        <p className="welcome-splash__eyebrow">{t("eyebrow")}</p>

        <div className="welcome-splash__brand">
          <JoinMyPdfLogo className="welcome-splash__logo" />
        </div>

        <h1 className="welcome-splash__title">{t("title")}</h1>
        <p className="welcome-splash__tagline">{t("tagline")}</p>

        <div className="welcome-splash__actions">
          <button type="button" className="welcome-splash__enter" onClick={enter}>
            <span>{t("enter")}</span>
            <svg
              className="welcome-splash__enter-icon"
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
          <p className="welcome-splash__hint">{t("hint")}</p>
        </div>
      </div>
    </div>
  );
}
