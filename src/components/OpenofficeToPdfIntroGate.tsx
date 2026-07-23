"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./openoffice-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type OpenofficeToPdfIntroGateProps = {
  /** When false, children render immediately (non–openoffice-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert OpenOffice to PDF Online.
 * ODT/ODS OpenOffice document morphs into a standardized PDF layout.
 * Only runs inside the ToolModal CALC embed.
 */
export function OpenofficeToPdfIntroGate({
  active = true,
  children,
}: OpenofficeToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("OpenofficeToPdfLanding");
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

    document.documentElement.setAttribute("data-openoffice-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-openoffice-to-pdf-intro");
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
        className="oop-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oop-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="oop-fs__header">
          <h1 id="oop-fs-title" className="oop-fs__title">
            <span className="oop-fs__title-brand">{t("brand")}</span>
            <span className="oop-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="oop-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="oop-fs__stage" aria-hidden>
          <div className="oop-fs__scene">
            <div
              className="oop-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="oop-fs__card">
                <div className="oop-fs__badges">
                  <span className="oop-fs__badge oop-fs__badge--odt">{t("odtBadge")}</span>
                  <span className="oop-fs__badge oop-fs__badge--ods">{t("odsBadge")}</span>
                  <span className="oop-fs__arrow" />
                  <span className="oop-fs__badge oop-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="oop-fs__stage-art">
                  <div className="oop-fs__oo">
                    <span className="oop-fs__oo-bar" />
                    <span className="oop-fs__oo-mark" />
                    <span className="oop-fs__oo-title">{t("docTitle")}</span>
                    <span className="oop-fs__oo-line" />
                    <span className="oop-fs__oo-line oop-fs__oo-line--short" />
                    <span className="oop-fs__oo-line" />
                    <span className="oop-fs__oo-grid" aria-hidden>
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="oop-fs__fname oop-fs__fname--odt">{t("odtName")}</span>
                    <span className="oop-fs__fname oop-fs__fname--ods">{t("odsName")}</span>
                  </div>

                  <div className="oop-fs__pdf">
                    <span className="oop-fs__pdf-fold" />
                    <span className="oop-fs__pdf-title">{t("docTitle")}</span>
                    <span className="oop-fs__pdf-line" />
                    <span className="oop-fs__pdf-line oop-fs__pdf-line--short" />
                    <span className="oop-fs__pdf-line" />
                    <span className="oop-fs__pdf-block" />
                    <span className="oop-fs__fname oop-fs__fname--pdf">{t("pdfName")}</span>
                  </div>

                  <span className="oop-fs__beam" />
                </div>

                <span className="oop-fs__ok">
                  <span className="oop-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="oop-fs__footer">
          <button type="button" className="oop-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="oop-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
