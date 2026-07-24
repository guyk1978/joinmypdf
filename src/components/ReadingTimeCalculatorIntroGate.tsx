"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./reading-time-calculator-landing.css";

type IntroPhase = "intro" | "workspace";

type ReadingTimeCalculatorIntroGateProps = {
  /** When false, children render immediately (non–reading-time-calculator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Reading Time Calculator.
 * Text block → 238 WPM analytical node + timer → duration / word-count badges.
 * Shows before the calculator workspace (embed modal and dedicated tool page).
 */
export function ReadingTimeCalculatorIntroGate({
  active = true,
  children,
}: ReadingTimeCalculatorIntroGateProps) {
  const introActive = active;
  const t = useTranslations("ReadingTimeCalculatorLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-reading-time-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-reading-time-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="rtc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rtc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="rtc-fs__header">
          <h1 id="rtc-fs-title" className="rtc-fs__title">
            <span className="rtc-fs__title-brand">{t("brand")}</span>
            <span className="rtc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rtc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rtc-fs__stage" aria-hidden>
          <div className="rtc-fs__scene">
            <div className="rtc-fs__workspace animation-workspace">
              <div className="rtc-fs__card">
                <div className="rtc-fs__pipeline">
                  <div className="rtc-fs__input">
                    <span className="rtc-fs__tag">{t("inputTag")}</span>
                    <div className="rtc-fs__text">
                      <span className="rtc-fs__line rtc-fs__line--1" />
                      <span className="rtc-fs__line rtc-fs__line--2" />
                      <span className="rtc-fs__line rtc-fs__line--3" />
                      <span className="rtc-fs__line rtc-fs__line--4" />
                      <span className="rtc-fs__line rtc-fs__line--5" />
                      <span className="rtc-fs__scan" />
                    </div>
                    <span className="rtc-fs__words">{t("wordCount")}</span>
                  </div>

                  <div className="rtc-fs__engine">
                    <span className="rtc-fs__flow" />
                    <span className="rtc-fs__core">
                      <span className="rtc-fs__wpm">{t("wpmLabel")}</span>
                    </span>
                    <span className="rtc-fs__watch">
                      <span className="rtc-fs__watch-hand" />
                    </span>
                    <span className="rtc-fs__progress">
                      <span className="rtc-fs__progress-fill" />
                    </span>
                  </div>

                  <div className="rtc-fs__result">
                    <span className="rtc-fs__tag rtc-fs__tag--out">{t("resultTag")}</span>
                    <div className="rtc-fs__duration">
                      <span className="rtc-fs__timer-icon" />
                      <span className="rtc-fs__duration-text">{t("durationBadge")}</span>
                    </div>
                    <div className="rtc-fs__meter">
                      <span className="rtc-fs__meter-seg" />
                      <span className="rtc-fs__meter-seg" />
                      <span className="rtc-fs__meter-seg" />
                      <span className="rtc-fs__meter-seg" />
                    </div>
                  </div>
                </div>

                <span className="rtc-fs__particle rtc-fs__particle--1" />
                <span className="rtc-fs__particle rtc-fs__particle--2" />
                <span className="rtc-fs__particle rtc-fs__particle--3" />
              </div>

              <span className="rtc-fs__ok">
                <span className="rtc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="rtc-fs__footer">
          <button type="button" className="rtc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="rtc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
