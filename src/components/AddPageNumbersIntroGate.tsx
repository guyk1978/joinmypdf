"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./add-page-numbers-landing.css";


type AddPageNumbersIntroGateProps = {
  /** When false, children render immediately (non–add-page-numbers tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Add Page Numbers.
 * Sequential page numbers appear on a PDF stack with custom placement.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function AddPageNumbersIntroGate({
  active = true,
  children,
}: AddPageNumbersIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-add-page-numbers-intro",
  });
  const t = useTranslations("AddPageNumbersLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="apn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apn-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="apn-fs__header">
          <h1 id="apn-fs-title" className="apn-fs__title">
            <span className="apn-fs__title-brand">{t("brand")}</span>
            <span className="apn-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="apn-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="apn-fs__stage" aria-hidden>
          <div className="apn-fs__scene">
            <div
              className="apn-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="apn-fs__card">
                <div className="apn-fs__badges">
                  <span className="apn-fs__badge apn-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="apn-fs__arrow" />
                  <span className="apn-fs__badge apn-fs__badge--num">{t("numBadge")}</span>
                </div>

                <div className="apn-fs__stage-art">
                  <div className="apn-fs__stack">
                    <div className="apn-fs__page apn-fs__page--3">
                      <span className="apn-fs__lines" />
                      <span className="apn-fs__folio">3</span>
                    </div>
                    <div className="apn-fs__page apn-fs__page--2">
                      <span className="apn-fs__lines" />
                      <span className="apn-fs__folio">2</span>
                    </div>
                    <div className="apn-fs__page apn-fs__page--1">
                      <span className="apn-fs__mark">{t("pdfBadge")}</span>
                      <span className="apn-fs__bar" />
                      <span className="apn-fs__line" />
                      <span className="apn-fs__line apn-fs__line--short" />
                      <span className="apn-fs__folio">1</span>
                    </div>
                  </div>

                  <div className="apn-fs__cursor" />
                </div>

                <span className="apn-fs__ok">
                  <span className="apn-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="apn-fs__footer">
          <button type="button" className="apn-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="apn-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
