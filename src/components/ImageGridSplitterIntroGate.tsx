"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./image-grid-splitter-landing.css";


type ImageGridSplitterIntroGateProps = {
  /** When false, children render immediately (non–image-grid-splitter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Grid Splitter.
 * Travel photo → cyan 3×3 grid lock → tiles explode outward + Grid Split badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function ImageGridSplitterIntroGate({
  active = true,
  children,
}: ImageGridSplitterIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-image-grid-splitter-intro",
  });
  const t = useTranslations("ImageGridSplitterLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="igs-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="igs-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="igs-fs__header">
          <h1 id="igs-fs-title" className="igs-fs__title">
            <span className="igs-fs__title-brand">{t("brand")}</span>
            <span className="igs-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="igs-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="igs-fs__stage" aria-hidden>
          <div className="igs-fs__scene">
            <div
              className="igs-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="igs-fs__card">
                <div className="igs-fs__stage-art">
                  <div className="igs-fs__frame">
                    <div className="igs-fs__photo">
                      <span className="igs-fs__sky" />
                      <span className="igs-fs__sun" />
                      <span className="igs-fs__mountain igs-fs__mountain--far" />
                      <span className="igs-fs__mountain igs-fs__mountain--near" />
                      <span className="igs-fs__water" />
                    </div>

                    <div className="igs-fs__grid">
                      <span className="igs-fs__vline igs-fs__vline--1" />
                      <span className="igs-fs__vline igs-fs__vline--2" />
                      <span className="igs-fs__hline igs-fs__hline--1" />
                      <span className="igs-fs__hline igs-fs__hline--2" />
                      <span className="igs-fs__crosshair" />
                    </div>

                    <div className="igs-fs__tiles">
                      {Array.from({ length: 9 }, (_, i) => (
                        <span
                          key={i}
                          className={`igs-fs__tile igs-fs__tile--${i + 1}`}
                        />
                      ))}
                    </div>

                    <div className="igs-fs__particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>

                <span className="igs-fs__ok">
                  <span className="igs-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="igs-fs__footer">
          <button type="button" className="igs-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="igs-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
