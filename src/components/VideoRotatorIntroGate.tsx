"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./video-rotator-landing.css";


type VideoRotatorIntroGateProps = {
  /** When false, children render immediately (non–video-rotator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Rotator.
 * Sideways player frame → glow arc → landscape snap + 0°→90° badges.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function VideoRotatorIntroGate({
  active = true,
  children,
}: VideoRotatorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-video-rotator-intro",
  });
  const t = useTranslations("VideoRotatorLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="vro-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vro-fs-title"
      >
        <header className="vro-fs__header">
          <h1 id="vro-fs-title" className="vro-fs__title">
            <span className="vro-fs__title-brand">{t("brand")}</span>
            <span className="vro-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vro-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vro-fs__stage" aria-hidden>
          <div className="vro-fs__scene">
            <div className="vro-fs__workspace animation-workspace" data-splash-wide>
              <div className="vro-fs__card">
                <div className="vro-fs__badges">
                  <span className="vro-fs__badge vro-fs__badge--from">{t("angleFrom")}</span>
                  <span className="vro-fs__arrow-label" aria-hidden>
                    →
                  </span>
                  <span className="vro-fs__badge vro-fs__badge--to">{t("angleTo")}</span>
                </div>

                <div className="vro-fs__canvas">
                  <div className="vro-fs__orbit">
                    <span className="vro-fs__arc" />
                    <span className="vro-fs__tip" />
                  </div>

                  <div className="vro-fs__player">
                    <div className="vro-fs__screen">
                      <span className="vro-fs__sky" />
                      <span className="vro-fs__hill" />
                      <span className="vro-fs__play" />
                    </div>
                    <div className="vro-fs__chrome">
                      <span className="vro-fs__dot" />
                      <span className="vro-fs__dot" />
                      <span className="vro-fs__scrub" />
                    </div>
                  </div>
                </div>
              </div>

              <span className="vro-fs__ok">
                <span className="vro-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="vro-fs__footer">
          <button type="button" className="vro-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vro-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
