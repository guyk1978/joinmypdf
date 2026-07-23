"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./password-recovery-landing.css";

type IntroPhase = "intro" | "workspace";

type PasswordRecoveryIntroGateProps = {
  /** When false, children render immediately (non–pdf-password-recovery tools). */
  active?: boolean;
  children: ReactNode;
};

const CANDIDATE_KEYS = [
  "1234",
  "qwerty",
  "pass01",
  "admin",
  "pdf2020",
  "letmein",
  "secret",
  "abc123",
];

/**
 * One-way cinematic fullscreen splash for Password Recovery.
 * Locked PDF + scan beam cycles wordlist keys → padlock opens + match badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function PasswordRecoveryIntroGate({
  active = true,
  children,
}: PasswordRecoveryIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PasswordRecoveryLanding");
  const matchedKey = t("matchedKey");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);
  const [candidate, setCandidate] = useState(CANDIDATE_KEYS[0]!);
  const [tries, setTries] = useState(128);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-password-recovery-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-password-recovery-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCandidate(matchedKey);
      setTries(1847);
      return;
    }

    const cycleMs = 9000;
    let keyIdx = 0;
    let tryCount = 128;
    let timeoutId = 0;
    let start = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - start) % cycleMs;
      // Scan candidates for ~5.2s, then lock onto the match
      if (elapsed < 5200) {
        keyIdx = (keyIdx + 1) % CANDIDATE_KEYS.length;
        tryCount += 17 + Math.floor(Math.random() * 41);
        setCandidate(CANDIDATE_KEYS[keyIdx]!);
        setTries(tryCount);
        timeoutId = window.setTimeout(tick, 90);
      } else {
        setCandidate(matchedKey);
        setTries(1847);
        const remaining = cycleMs - elapsed;
        timeoutId = window.setTimeout(() => {
          start = performance.now();
          tryCount = 128;
          keyIdx = 0;
          tick();
        }, remaining);
      }
    };

    tick();
    return () => window.clearTimeout(timeoutId);
  }, [introActive, phase, matchedKey]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="pwr-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwr-fs-title"
      >
        <header className="pwr-fs__header">
          <h1 id="pwr-fs-title" className="pwr-fs__title">
            <span className="pwr-fs__title-brand">{t("brand")}</span>
            <span className="pwr-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="pwr-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="pwr-fs__stage" aria-hidden>
          <div className="pwr-fs__scene">
            <div className="pwr-fs__workspace animation-workspace">
              <div className="pwr-fs__card">
                <div className="pwr-fs__badges">
                  <span className="pwr-fs__badge pwr-fs__badge--local">{t("localBadge")}</span>
                  <span className="pwr-fs__badge pwr-fs__badge--tries">
                    {t("triesBadge", { count: tries })}
                  </span>
                </div>

                <div className="pwr-fs__doc">
                  <div className="pwr-fs__page pwr-fs__page--locked">
                    <span className="pwr-fs__line" />
                    <span className="pwr-fs__line pwr-fs__line--short" />
                    <span className="pwr-fs__line" />
                    <span className="pwr-fs__lock" />
                  </div>
                  <div className="pwr-fs__page pwr-fs__page--open">
                    <span className="pwr-fs__line" />
                    <span className="pwr-fs__line pwr-fs__line--short" />
                    <span className="pwr-fs__line" />
                    <span className="pwr-fs__unlock" />
                  </div>
                  <div className="pwr-fs__beam" />
                </div>

                <div className="pwr-fs__probe">
                  <span className="pwr-fs__probe-label">{t("tryingLabel")}</span>
                  <code className="pwr-fs__probe-key">{candidate}</code>
                </div>
              </div>

              <span className="pwr-fs__ok">
                <span className="pwr-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="pwr-fs__footer">
          <button type="button" className="pwr-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="pwr-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
