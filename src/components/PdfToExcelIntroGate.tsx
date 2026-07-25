"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-excel-landing.css";


type PdfToExcelIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-excel tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to Excel.
 * PDF table → alignment scan → cells snap into Excel grid with ƒx indicators.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToExcelIntroGate({
  active = true,
  children,
}: PdfToExcelIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-excel-intro",
  });
  const t = useTranslations("PdfToExcelLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="p2x-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2x-fs-title"
      >
        <header className="p2x-fs__header">
          <h1 id="p2x-fs-title" className="p2x-fs__title">
            <span className="p2x-fs__title-brand">{t("brand")}</span>
            <span className="p2x-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="p2x-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="p2x-fs__stage" aria-hidden>
          <div className="p2x-fs__scene">
            <div className="p2x-fs__workspace animation-workspace">
              <div className="p2x-fs__pdf">
                <div className="p2x-fs__pdf-sheet">
                  <span className="p2x-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="p2x-fs__static">
                    <div className="p2x-fs__srow p2x-fs__srow--head">
                      <span /><span /><span /><span />
                    </div>
                    <div className="p2x-fs__srow"><span /><span /><span /><span /></div>
                    <div className="p2x-fs__srow"><span /><span /><span /><span /></div>
                    <div className="p2x-fs__srow"><span /><span /><span /><span /></div>
                    <div className="p2x-fs__srow"><span /><span /><span /><span /></div>
                  </div>
                  <div className="p2x-fs__align" />
                  <div className="p2x-fs__scan" />
                </div>
                <span className="p2x-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="p2x-fs__excel">
                <div className="p2x-fs__excel-card">
                  <div className="p2x-fs__excel-bar">
                    <span className="p2x-fs__xls">{t("xlsBadge")}</span>
                    <span className="p2x-fs__fx">{t("fx")}</span>
                  </div>
                  <div className="p2x-fs__grid">
                    <div className="p2x-fs__grow p2x-fs__grow--head">
                      <span /><span /><span /><span />
                    </div>
                    <div className="p2x-fs__grow p2x-fs__grow--1">
                      <span /><span /><span /><span />
                    </div>
                    <div className="p2x-fs__grow p2x-fs__grow--2">
                      <span /><span /><span /><span />
                    </div>
                    <div className="p2x-fs__grow p2x-fs__grow--3">
                      <span /><span /><span /><span />
                    </div>
                    <div className="p2x-fs__grow p2x-fs__grow--4">
                      <span /><span /><span /><span />
                    </div>
                  </div>
                  <span className="p2x-fs__locked">{t("locked")}</span>
                </div>
                <span className="p2x-fs__excel-name">{t("excelName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p2x-fs__footer">
          <button type="button" className="p2x-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="p2x-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
