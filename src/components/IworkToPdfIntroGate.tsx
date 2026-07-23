"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./iwork-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type IworkToPdfIntroGateProps = {
  /** When false, children render immediately (non–iwork-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert iWork to PDF Online.
 * Apple Pages/Keynote badge morphs into a standardized PDF layout.
 * Only runs inside the ToolModal CALC embed.
 */
export function IworkToPdfIntroGate({ active = true, children }: IworkToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("IworkToPdfLanding");
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

    document.documentElement.setAttribute("data-iwork-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-iwork-to-pdf-intro");
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
        className="iwp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="iwp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="iwp-fs__header">
          <h1 id="iwp-fs-title" className="iwp-fs__title">
            <span className="iwp-fs__title-brand">{t("brand")}</span>
            <span className="iwp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="iwp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="iwp-fs__stage" aria-hidden>
          <div className="iwp-fs__scene">
            <div className="iwp-fs__workspace animation-workspace">
              <div className="iwp-fs__card">
                <div className="iwp-fs__badges">
                  <span className="iwp-fs__badge iwp-fs__badge--pages">{t("pagesBadge")}</span>
                  <span className="iwp-fs__arrow" />
                  <span className="iwp-fs__badge iwp-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="iwp-fs__stage-art">
                  <div className="iwp-fs__pages">
                    <span className="iwp-fs__pages-icon" />
                    <span className="iwp-fs__pages-title">{t("docTitle")}</span>
                    <span className="iwp-fs__pages-line" />
                    <span className="iwp-fs__pages-line iwp-fs__pages-line--short" />
                    <span className="iwp-fs__pages-line" />
                    <span className="iwp-fs__fname iwp-fs__fname--pages">{t("pagesName")}</span>
                  </div>

                  <div className="iwp-fs__pdf">
                    <span className="iwp-fs__pdf-fold" />
                    <span className="iwp-fs__pdf-title">{t("docTitle")}</span>
                    <span className="iwp-fs__pdf-line" />
                    <span className="iwp-fs__pdf-line iwp-fs__pdf-line--short" />
                    <span className="iwp-fs__pdf-line" />
                    <span className="iwp-fs__pdf-block" />
                    <span className="iwp-fs__fname iwp-fs__fname--pdf">{t("pdfName")}</span>
                  </div>

                  <span className="iwp-fs__beam" />
                </div>

                <span className="iwp-fs__ok">
                  <span className="iwp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="iwp-fs__footer">
          <button type="button" className="iwp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="iwp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
