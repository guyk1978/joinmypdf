"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-powerpoint-landing.css";


type PdfToPowerpointIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-powerpoint tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PDF to PowerPoint Online.
 * A static PDF splits into editable PowerPoint slide thumbnails.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToPowerpointIntroGate({
  active = true,
  children,
}: PdfToPowerpointIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-to-powerpoint-intro",
  });
  const t = useTranslations("PdfToPowerpointLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ptp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ptp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ptp-fs__header">
          <h1 id="ptp-fs-title" className="ptp-fs__title">
            <span className="ptp-fs__title-brand">{t("brand")}</span>
            <span className="ptp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ptp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ptp-fs__stage" aria-hidden>
          <div className="ptp-fs__scene">
            <div
              className="ptp-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ptp-fs__card">
                <div className="ptp-fs__badges">
                  <span className="ptp-fs__badge ptp-fs__badge--pdf">{t("pdfBadge")}</span>
                  <span className="ptp-fs__arrow" />
                  <span className="ptp-fs__badge ptp-fs__badge--pptx">{t("pptxBadge")}</span>
                </div>

                <div className="ptp-fs__stage-art">
                  <div className="ptp-fs__pdf">
                    <span className="ptp-fs__pdf-fold" />
                    <span className="ptp-fs__pdf-mark">PDF</span>
                    <span className="ptp-fs__pdf-title">{t("docTitle")}</span>
                    <span className="ptp-fs__pdf-line" />
                    <span className="ptp-fs__pdf-line ptp-fs__pdf-line--short" />
                    <span className="ptp-fs__pdf-line" />
                    <span className="ptp-fs__pdf-block" />
                  </div>

                  <div className="ptp-fs__deck">
                    <div className="ptp-fs__slide ptp-fs__slide--1">
                      <span className="ptp-fs__slide-num">1</span>
                      <span className="ptp-fs__slide-bar" />
                      <span className="ptp-fs__slide-line" />
                      <span className="ptp-fs__slide-line ptp-fs__slide-line--short" />
                    </div>
                    <div className="ptp-fs__slide ptp-fs__slide--2">
                      <span className="ptp-fs__slide-num">2</span>
                      <span className="ptp-fs__slide-grid">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                    <div className="ptp-fs__slide ptp-fs__slide--3">
                      <span className="ptp-fs__slide-num">3</span>
                      <span className="ptp-fs__slide-bar ptp-fs__slide-bar--wide" />
                      <span className="ptp-fs__slide-dot" />
                      <span className="ptp-fs__slide-dot" />
                      <span className="ptp-fs__slide-dot" />
                    </div>
                  </div>

                  <span className="ptp-fs__beam" />
                </div>

                <span className="ptp-fs__ok">
                  <span className="ptp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ptp-fs__footer">
          <button type="button" className="ptp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ptp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
