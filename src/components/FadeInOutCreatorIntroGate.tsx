"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./fade-in-out-landing.css";

type IntroPhase = "intro" | "workspace";

type FadeInOutCreatorIntroGateProps = {
  /** When false, children render immediately (non–fade-in-out-creator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Fade In/Out Creator.
 * Waveform card → glow curves ramp edges → fade badges + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function FadeInOutCreatorIntroGate({
  active = true,
  children,
}: FadeInOutCreatorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FadeInOutCreatorLanding");
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

    document.documentElement.setAttribute("data-fade-in-out-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-fade-in-out-intro");
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
        className="fio-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fio-fs-title"
      >
        <header className="fio-fs__header">
          <h1 id="fio-fs-title" className="fio-fs__title">
            <span className="fio-fs__title-brand">{t("brand")}</span>
            <span className="fio-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="fio-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="fio-fs__stage" aria-hidden>
          <div className="fio-fs__scene">
            <div className="fio-fs__workspace animation-workspace">
              <div className="fio-fs__card">
                <div className="fio-fs__badges">
                  <span className="fio-fs__badge fio-fs__badge--in">{t("fadeIn")}</span>
                  <span className="fio-fs__badge fio-fs__badge--out">{t("fadeOut")}</span>
                </div>

                <div className="fio-fs__wave-wrap">
                  <div className="fio-fs__wave" />
                  <div className="fio-fs__mask fio-fs__mask--in" />
                  <div className="fio-fs__mask fio-fs__mask--out" />
                  <svg className="fio-fs__curve fio-fs__curve--in" viewBox="0 0 100 60" preserveAspectRatio="none">
                    <path d="M0 58 C 18 58, 28 8, 46 8" />
                  </svg>
                  <svg className="fio-fs__curve fio-fs__curve--out" viewBox="0 0 100 60" preserveAspectRatio="none">
                    <path d="M54 8 C 72 8, 82 58, 100 58" />
                  </svg>
                </div>

                <div className="fio-fs__times">
                  <span>{t("inDuration")}</span>
                  <span>{t("outDuration")}</span>
                </div>
              </div>

              <span className="fio-fs__ok">
                <span className="fio-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="fio-fs__footer">
          <button type="button" className="fio-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="fio-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
