"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./excel-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type ExcelToPdfIntroGateProps = {
  /** When false, children render immediately (non–excel-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Excel to PDF.
 * Spreadsheet grid → format-lock sweep → polished PDF with integrity check.
 * Only runs inside the ToolModal CALC embed.
 */
export function ExcelToPdfIntroGate({
  active = true,
  children,
}: ExcelToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ExcelToPdfLanding");
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

    document.documentElement.setAttribute("data-excel-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-excel-intro");
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
        className="xls-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="xls-fs-title"
      >
        <header className="xls-fs__header">
          <h1 id="xls-fs-title" className="xls-fs__title">
            <span className="xls-fs__title-brand">{t("brand")}</span>
            <span className="xls-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="xls-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="xls-fs__stage" aria-hidden>
          <div className="xls-fs__scene">
            <div className="xls-fs__workspace">
              <div className="xls-fs__sheet">
                <div className="xls-fs__sheet-bar">
                  <span className="xls-fs__xls-badge">{t("xlsBadge")}</span>
                  <span className="xls-fs__sheet-name">{t("sheetName")}</span>
                </div>
                <div className="xls-fs__grid">
                  <div className="xls-fs__row xls-fs__row--head">
                    <span /><span /><span /><span /><span />
                  </div>
                  <div className="xls-fs__row">
                    <span>A1</span><span>124</span><span>38</span><span>92</span><span>SUM</span>
                  </div>
                  <div className="xls-fs__row">
                    <span>A2</span><span>87</span><span>41</span><span>55</span><span>OK</span>
                  </div>
                  <div className="xls-fs__row">
                    <span>A3</span><span>210</span><span>16</span><span>74</span><span>OK</span>
                  </div>
                  <div className="xls-fs__row">
                    <span>A4</span><span>63</span><span>29</span><span>48</span><span>OK</span>
                  </div>
                  <div className="xls-fs__row">
                    <span>A5</span><span>155</span><span>22</span><span>81</span><span>OK</span>
                  </div>
                </div>
                <div className="xls-fs__sweep" />
                <div className="xls-fs__integrity">
                  <span className="xls-fs__check" />
                  <span>{t("integrity")}</span>
                </div>
                <span className="xls-fs__calc">{t("calc")}</span>
              </div>

              <div className="xls-fs__pdf">
                <div className="xls-fs__pdf-sheet">
                  <span className="xls-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="xls-fs__pdf-table">
                    <div className="xls-fs__pdf-row xls-fs__pdf-row--head">
                      <span /><span /><span /><span />
                    </div>
                    <div className="xls-fs__pdf-row"><span /><span /><span /><span /></div>
                    <div className="xls-fs__pdf-row"><span /><span /><span /><span /></div>
                    <div className="xls-fs__pdf-row"><span /><span /><span /><span /></div>
                    <div className="xls-fs__pdf-row"><span /><span /><span /><span /></div>
                  </div>
                  <span className="xls-fs__layout">{t("layout")}</span>
                </div>
                <span className="xls-fs__pdf-name">{t("pdfName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xls-fs__footer">
          <button type="button" className="xls-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="xls-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
