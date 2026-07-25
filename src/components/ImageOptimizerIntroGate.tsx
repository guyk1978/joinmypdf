"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./image-optimizer-landing.css";


type ImageOptimizerIntroGateProps = {
  /** When false, children render immediately (non–image-optimizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Universal Image Optimizer & Converter.
 * Image card → compression beam + size counter drop → loupe proves clarity + optimized badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function ImageOptimizerIntroGate({
  active = true,
  children,
}: ImageOptimizerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-image-optimizer-intro",
  });
  const t = useTranslations("ImageOptimizerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="iopt-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="iopt-fs-title"
      >
        <header className="iopt-fs__header">
          <h1 id="iopt-fs-title" className="iopt-fs__title">
            <span className="iopt-fs__title-brand">{t("brand")}</span>
            <span className="iopt-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="iopt-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="iopt-fs__stage" aria-hidden>
          <div className="iopt-fs__scene">
            <div className="iopt-fs__workspace animation-workspace">
              <div className="iopt-fs__card">
                <div className="iopt-fs__photo">
                  <div className="iopt-fs__sky" />
                  <div className="iopt-fs__hills" />
                  <div className="iopt-fs__detail" />
                  <div className="iopt-fs__beam" />
                  <div className="iopt-fs__loupe">
                    <span className="iopt-fs__loupe-glass" />
                    <span className="iopt-fs__loupe-ring" />
                  </div>
                </div>

                <div className="iopt-fs__meta">
                  <div className="iopt-fs__sizes">
                    <span className="iopt-fs__size iopt-fs__size--from">{t("sizeFrom")}</span>
                    <span className="iopt-fs__size iopt-fs__size--to">{t("sizeTo")}</span>
                  </div>
                  <span className="iopt-fs__savings">{t("savings")}</span>
                </div>
              </div>

              <span className="iopt-fs__ok">
                <span className="iopt-fs__check" />
                {t("optimized")}
              </span>
            </div>
          </div>
        </div>

        <div className="iopt-fs__footer">
          <button type="button" className="iopt-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="iopt-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
