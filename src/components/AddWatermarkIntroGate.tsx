"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./add-watermark-landing.css";


type AddWatermarkIntroGateProps = {
  /** When false, children render immediately (non–add-watermark tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Add Watermark.
 * A semi-transparent text stamp rotates and imprints across a PDF page.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function AddWatermarkIntroGate({
  active = true,
  children,
}: AddWatermarkIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-add-watermark-intro",
  });
  const t = useTranslations("AddWatermarkLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="awm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="awm-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="awm-fs__header">
          <h1 id="awm-fs-title" className="awm-fs__title">
            <span className="awm-fs__title-brand">{t("brand")}</span>
            <span className="awm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="awm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="awm-fs__stage" aria-hidden>
          <div className="awm-fs__scene">
            <div
              className="awm-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="awm-fs__card">
                <div className="awm-fs__badges">
                  <span className="awm-fs__badge awm-fs__badge--clean">{t("cleanBadge")}</span>
                  <span className="awm-fs__arrow" />
                  <span className="awm-fs__badge awm-fs__badge--marked">{t("markedBadge")}</span>
                </div>

                <div className="awm-fs__stage-art">
                  <div className="awm-fs__doc">
                    <span className="awm-fs__fold" />
                    <span className="awm-fs__mark">{t("pdfBadge")}</span>
                    <span className="awm-fs__bar" />
                    <span className="awm-fs__line" />
                    <span className="awm-fs__line awm-fs__line--short" />
                    <span className="awm-fs__line" />
                    <span className="awm-fs__stamp">{t("stampText")}</span>
                  </div>

                  <div className="awm-fs__stamp-float" aria-hidden>
                    {t("stampText")}
                  </div>
                </div>

                <span className="awm-fs__ok">
                  <span className="awm-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="awm-fs__footer">
          <button type="button" className="awm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="awm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
