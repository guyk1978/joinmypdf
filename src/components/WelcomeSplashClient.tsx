"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  WELCOME_ENTERED_STORAGE_KEY,
  WELCOME_ENTERED_VALUE,
} from "@/lib/welcome-splash";

type Gate = "show" | "redirecting";

type Props = {
  eyebrow: string;
  title: string;
  tagline: string;
  enterLabel: string;
  hint: string;
  redirectingLabel: string;
  brand: ReactNode;
};

/**
 * Client island for welcome splash — Enter CTA + returning-visitor fallback.
 * Hero copy/brand are passed from the server so LCP text is in the SSR HTML.
 */
export function WelcomeSplashClient({
  eyebrow,
  title,
  tagline,
  enterLabel,
  hint,
  redirectingLabel,
  brand,
}: Props) {
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
        <span className="sr-only">{redirectingLabel}</span>
        <div className="welcome-splash__boot-ring" aria-hidden />
      </div>
    );
  }

  return (
    <div className="welcome-splash">
      <div className="welcome-splash__content">
        <p className="welcome-splash__eyebrow">{eyebrow}</p>

        <div className="welcome-splash__brand">{brand}</div>

        <h1 className="welcome-splash__title">{title}</h1>
        <p className="welcome-splash__tagline">{tagline}</p>

        <div className="welcome-splash__actions">
          <button type="button" className="welcome-splash__enter" onClick={enter}>
            <span>{enterLabel}</span>
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
          <p className="welcome-splash__hint">{hint}</p>
        </div>
      </div>
    </div>
  );
}
