"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./pdf-to-xps-landing.css";

type IntroPhase = "intro" | "workspace";

type PdfToXpsIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-xps tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to XPS Converter Online.
 * A standard PDF transforms into a Windows-compatible XPS document.
 * Only runs inside the ToolModal CALC embed.
 */
export function PdfToXpsIntroGate({ active = true, children }: PdfToXpsIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PdfToXpsLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-pdf-to-xps-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-to-xps-intro");
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
        className="ptx-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ptx-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ptx-fs__header">
          <h1 id="ptx-fs-title" className="ptx-fs__title">
            <span className="ptx-fs__title-brand">{t("brand")}</span>
            <span className="ptx-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ptx-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ptx-fs__stage" aria-hidden>
          <div className="ptx-fs__scene">
            <div
              className="ptx-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ptx-fs__card">
                <div className="ptx-fs__badges">
                  <span className="ptx-fs__badge ptx-fs__badge--pdf">{t("pdfBadge")}</span>
                  <span className="ptx-fs__arrow" />
                  <span className="ptx-fs__badge ptx-fs__badge--xps">{t("xpsBadge")}</span>
                </div>

                <div className="ptx-fs__stage-art">
                  <div className="ptx-fs__pdf">
                    <span className="ptx-fs__pdf-fold" />
                    <span className="ptx-fs__pdf-mark">PDF</span>
                    <span className="ptx-fs__pdf-title">{t("docTitle")}</span>
                    <span className="ptx-fs__pdf-line" />
                    <span className="ptx-fs__pdf-line ptx-fs__pdf-line--short" />
                    <span className="ptx-fs__pdf-line" />
                    <span className="ptx-fs__pdf-block" />
                  </div>

                  <div className="ptx-fs__xps">
                    <div className="ptx-fs__winbar">
                      <span className="ptx-fs__win-icon" aria-hidden />
                      <span className="ptx-fs__win-title">{t("xpsTitle")}</span>
                      <span className="ptx-fs__win-controls" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                    <div className="ptx-fs__xps-body">
                      <span className="ptx-fs__xps-title">{t("docTitle")}</span>
                      <span className="ptx-fs__xps-line" />
                      <span className="ptx-fs__xps-line ptx-fs__xps-line--short" />
                      <span className="ptx-fs__xps-line" />
                      <span className="ptx-fs__xps-seal">{t("xpsSeal")}</span>
                    </div>
                  </div>

                  <span className="ptx-fs__beam" />
                </div>

                <span className="ptx-fs__ok">
                  <span className="ptx-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ptx-fs__footer">
          <button type="button" className="ptx-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ptx-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
