"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./extract-tables-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type ExtractTablesPdfIntroGateProps = {
  /** When false, children render immediately (non–extract-tables-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Extract Tables from PDF.
 * PDF with embedded table → scan overlay → rows detach into Excel/CSV card.
 * Only runs inside the ToolModal CALC embed.
 */
export function ExtractTablesPdfIntroGate({
  active = true,
  children,
}: ExtractTablesPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ExtractTablesPdfLanding");
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

    document.documentElement.setAttribute("data-extract-tables-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-extract-tables-intro");
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
        className="xtbl-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="xtbl-fs-title"
      >
        <header className="xtbl-fs__header">
          <h1 id="xtbl-fs-title" className="xtbl-fs__title">
            <span className="xtbl-fs__title-brand">{t("brand")}</span>
            <span className="xtbl-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="xtbl-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="xtbl-fs__stage" aria-hidden>
          <div className="xtbl-fs__scene">
            <div className="xtbl-fs__workspace">
              <div className="xtbl-fs__particles">
                <span /><span /><span /><span /><span /><span />
              </div>

              <div className="xtbl-fs__pdf">
                <div className="xtbl-fs__pdf-sheet">
                  <span className="xtbl-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="xtbl-fs__align" />
                  <div className="xtbl-fs__table">
                    <div className="xtbl-fs__scan" />
                    <div className="xtbl-fs__trow xtbl-fs__trow--head">
                      <span /><span /><span /><span />
                    </div>
                    <div className="xtbl-fs__trow xtbl-fs__trow--1">
                      <span /><span /><span /><span />
                    </div>
                    <div className="xtbl-fs__trow xtbl-fs__trow--2">
                      <span /><span /><span /><span />
                    </div>
                    <div className="xtbl-fs__trow xtbl-fs__trow--3">
                      <span /><span /><span /><span />
                    </div>
                    <div className="xtbl-fs__trow xtbl-fs__trow--4">
                      <span /><span /><span /><span />
                    </div>
                  </div>
                  <span className="xtbl-fs__coords">{t("coords")}</span>
                </div>
                <span className="xtbl-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="xtbl-fs__sheet">
                <div className="xtbl-fs__sheet-card">
                  <div className="xtbl-fs__badges">
                    <span className="xtbl-fs__xls">{t("xlsBadge")}</span>
                    <span className="xtbl-fs__csv">{t("csvBadge")}</span>
                  </div>
                  <div className="xtbl-fs__grid">
                    <div className="xtbl-fs__grow xtbl-fs__grow--head">
                      <span /><span /><span /><span />
                    </div>
                    <div className="xtbl-fs__grow"><span /><span /><span /><span /></div>
                    <div className="xtbl-fs__grow"><span /><span /><span /><span /></div>
                    <div className="xtbl-fs__grow"><span /><span /><span /><span /></div>
                    <div className="xtbl-fs__grow"><span /><span /><span /><span /></div>
                  </div>
                  <span className="xtbl-fs__editable">{t("editable")}</span>
                </div>
                <span className="xtbl-fs__sheet-name">{t("sheetName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xtbl-fs__footer">
          <button type="button" className="xtbl-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="xtbl-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
