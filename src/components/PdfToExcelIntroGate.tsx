"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./pdf-to-excel-landing.css";

type IntroPhase = "intro" | "workspace";

type PdfToExcelIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-excel tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to Excel.
 * PDF table → alignment scan → cells snap into Excel grid with ƒx indicators.
 * Only runs inside the ToolModal CALC embed.
 */
export function PdfToExcelIntroGate({
  active = true,
  children,
}: PdfToExcelIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PdfToExcelLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-pdf-excel-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-excel-intro");
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
        className="p2x-fs"
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
            <div className="p2x-fs__workspace">
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
      return <div className="p2x-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
