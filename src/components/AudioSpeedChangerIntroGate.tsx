"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./audio-speed-changer-landing.css";

type IntroPhase = "intro" | "workspace";

type AudioSpeedChangerIntroGateProps = {
  /** When false, children render immediately (non–mp3-speed-changer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Audio Speed Changer.
 * Wave spectrum + rate slider 1.0x→1.5x → laser scrub + Tempo Adjusted.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function AudioSpeedChangerIntroGate({
  active = true,
  children,
}: AudioSpeedChangerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("AudioSpeedChangerLanding");
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

    document.documentElement.setAttribute("data-audio-speed-changer-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-audio-speed-changer-intro");
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
        className="asc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="asc-fs__header">
          <h1 id="asc-fs-title" className="asc-fs__title">
            <span className="asc-fs__title-brand">{t("brand")}</span>
            <span className="asc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="asc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="asc-fs__stage" aria-hidden>
          <div className="asc-fs__scene">
            <div className="asc-fs__workspace animation-workspace">
              <div className="asc-fs__card">
                <div className="asc-fs__rate-row">
                  <span className="asc-fs__rate-label">{t("rateLabel")}</span>
                  <div className="asc-fs__slider">
                    <span className="asc-fs__track" />
                    <span className="asc-fs__fill" />
                    <span className="asc-fs__thumb" />
                  </div>
                  <span className="asc-fs__rate-value">
                    <span className="asc-fs__rate-from">{t("rate1x")}</span>
                    <span className="asc-fs__rate-to">{t("rate15x")}</span>
                  </span>
                </div>

                <div className="asc-fs__wave-wrap">
                  <div className="asc-fs__spectrum">
                    {Array.from({ length: 26 }, (_, i) => (
                      <span
                        key={i}
                        className="asc-fs__bar"
                        style={{ animationDelay: `${(i % 13) * 0.06}s` }}
                      />
                    ))}
                  </div>
                  <div className="asc-fs__laser" />
                  <div className="asc-fs__pitch-lock">
                    <span className="asc-fs__pitch-dot" />
                    {t("pitchLock")}
                  </div>
                </div>

                <div className="asc-fs__pills">
                  <span className="asc-fs__pill asc-fs__pill--slow">{t("pill05")}</span>
                  <span className="asc-fs__pill asc-fs__pill--base">{t("pill10")}</span>
                  <span className="asc-fs__pill asc-fs__pill--fast">{t("pill20")}</span>
                </div>
              </div>

              <span className="asc-fs__ok">
                <span className="asc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="asc-fs__footer">
          <button type="button" className="asc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="asc-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
