"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-reader-landing.css";


type PdfReaderIntroGateProps = {
  /** When false, children render immediately (non–pdf-reader tools). */
  active?: boolean;
  children: ReactNode;
};


/**
 * One-way cinematic fullscreen splash for PDF Reader Online.
 * Live document render → page navigation → zoom → text select → success badge.
 * Shows before the reader workspace (embed modal and dedicated tool page).
 */
export function PdfReaderIntroGate({
  active = true,
  children,
}: PdfReaderIntroGateProps) {
  const { introActive, phase, portalReady, startTool, ctaRef } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-reader-intro",
    persistKey: "joinmypdf:pdf-reader-intro-done",
  });
  const t = useTranslations("PdfReaderLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="prd-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prd-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="prd-fs__header tool-intro__header">
          <h1 id="prd-fs-title" className="prd-fs__title">
            <span className="prd-fs__title-brand">{t("brand")}</span>
            <span className="prd-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="prd-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="prd-fs__stage tool-intro__stage" aria-hidden>
          <div className="prd-fs__scene">
            <div className="prd-fs__workspace animation-workspace tool-intro__visual">
              <div className="prd-fs__card">
                <div className="prd-fs__viewer">
                  <div className="prd-fs__chrome">
                    <div className="prd-fs__nav">
                      <span className="prd-fs__nav-btn" />
                      <span className="prd-fs__page-label">{t("pageLabel")}</span>
                      <span className="prd-fs__nav-btn prd-fs__nav-btn--next" />
                    </div>
                    <div className="prd-fs__zoom">
                      <span>{t("zoomLabel")}</span>
                      <span className="prd-fs__zoom-track">
                        <span className="prd-fs__zoom-fill" />
                      </span>
                    </div>
                  </div>
                  <div className="prd-fs__page">
                    <span className="prd-fs__line prd-fs__line--title" />
                    <span className="prd-fs__line" />
                    <span className="prd-fs__line prd-fs__line--mid" />
                    <span className="prd-fs__line prd-fs__line--short" />
                    <span className="prd-fs__line" />
                    <span className="prd-fs__line prd-fs__line--mid" />
                    <span className="prd-fs__select" />
                    <span className="prd-fs__scan" />
                  </div>
                </div>

                <span className="prd-fs__ok">
                  <span className="prd-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="prd-fs__footer tool-intro__footer">
          <button
            ref={ctaRef}
            type="button"
            className="prd-fs__cta"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startTool();
            }}
          >
            {t("getStarted")}
          </button>
          <button
            type="button"
            className="tool-intro__skip"
            onClick={(event) => {
              event.preventDefault();
              startTool();
            }}
          >
            {t.has("skip") ? t("skip") : "Skip"}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="prd-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
