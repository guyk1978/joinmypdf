"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { JoinMyPdfLogo } from "@/components/JoinMyPdfLogo";
import { useRouter } from "@/i18n/navigation";
import {
  WELCOME_ENTERED_STORAGE_KEY,
  WELCOME_ENTERED_VALUE,
} from "@/lib/welcome-splash";

type Gate = "checking" | "show" | "redirecting";

/**
 * Immersive dark welcome screen for the locale root.
 * First visit shows brand + Enter CTA; returning visitors (localStorage) go to /home.
 */
export function WelcomeSplash() {
  const t = useTranslations("Home.splash");
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("checking");

  useEffect(() => {
    try {
      if (window.localStorage.getItem(WELCOME_ENTERED_STORAGE_KEY) === WELCOME_ENTERED_VALUE) {
        setGate("redirecting");
        router.replace("/home");
        return;
      }
    } catch {
      /* private mode / blocked storage — still show splash */
    }
    setGate("show");
  }, [router]);

  const enter = () => {
    try {
      window.localStorage.setItem(WELCOME_ENTERED_STORAGE_KEY, WELCOME_ENTERED_VALUE);
    } catch {
      /* ignore */
    }
    router.push("/home");
  };

  if (gate !== "show") {
    return (
      <div
        className="welcome-splash welcome-splash--boot"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">{t("redirecting")}</span>
      </div>
    );
  }

  return (
    <div className="welcome-splash">
      <div className="welcome-splash__atmosphere" aria-hidden />
      <div className="welcome-splash__grid" aria-hidden />

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
            <ArrowRight className="welcome-splash__enter-icon" aria-hidden strokeWidth={2.25} />
          </button>
          <p className="welcome-splash__hint">{t("hint")}</p>
        </div>
      </div>
    </div>
  );
}
