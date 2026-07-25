"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./repair-pdf-landing.css";


type RepairPdfIntroGateProps = {
  /** When false, children render immediately (non–repair-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Repair PDF Online.
 * A corrupted PDF scans xref damage, repairs structure, and locks into a healthy document.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function RepairPdfIntroGate({
  active = true,
  children,
}: RepairPdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-repair-pdf-intro",
  });
  const t = useTranslations("RepairPdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="rpr-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpr-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="rpr-fs__header">
          <h1 id="rpr-fs-title" className="rpr-fs__title">
            <span className="rpr-fs__title-brand">{t("brand")}</span>
            <span className="rpr-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rpr-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rpr-fs__stage" aria-hidden>
          <div className="rpr-fs__scene">
            <div
              className="rpr-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="rpr-fs__card">
                <div className="rpr-fs__badges">
                  <span className="rpr-fs__badge rpr-fs__badge--broken">{t("brokenBadge")}</span>
                  <span className="rpr-fs__arrow" />
                  <span className="rpr-fs__badge rpr-fs__badge--ok">{t("okBadge")}</span>
                </div>

                <div className="rpr-fs__stage-art">
                  <div className="rpr-fs__damaged">
                    <span className="rpr-fs__fold" />
                    <span className="rpr-fs__mark">{t("pdfBadge")}</span>
                    <div className="rpr-fs__xref">
                      <span className="rpr-fs__xref-row rpr-fs__xref-row--bad" />
                      <span className="rpr-fs__xref-row rpr-fs__xref-row--gap" />
                      <span className="rpr-fs__xref-row rpr-fs__xref-row--tilt" />
                      <span className="rpr-fs__xref-row" />
                    </div>
                    <span className="rpr-fs__crack rpr-fs__crack--1" />
                    <span className="rpr-fs__crack rpr-fs__crack--2" />
                    <span className="rpr-fs__error">{t("errorCode")}</span>
                    <span className="rpr-fs__scan" />
                  </div>

                  <div className="rpr-fs__healthy">
                    <span className="rpr-fs__fold rpr-fs__fold--ok" />
                    <span className="rpr-fs__mark">{t("pdfBadge")}</span>
                    <span className="rpr-fs__title-line" />
                    <span className="rpr-fs__body-line" />
                    <span className="rpr-fs__body-line rpr-fs__body-line--short" />
                    <span className="rpr-fs__body-line" />
                    <span className="rpr-fs__lock" />
                    <span className="rpr-fs__seal">{t("okBadge")}</span>
                  </div>
                </div>

                <span className="rpr-fs__ok">
                  <span className="rpr-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rpr-fs__footer">
          <button type="button" className="rpr-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="rpr-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
