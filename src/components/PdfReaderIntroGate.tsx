"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./pdf-reader-landing.css";

type IntroPhase = "intro" | "workspace";

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
  const introActive = active;
  const t = useTranslations("PdfReaderLanding");
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

    document.documentElement.setAttribute("data-pdf-reader-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-reader-intro");
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
        className="prd-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prd-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="prd-fs__header">
          <h1 id="prd-fs-title" className="prd-fs__title">
            <span className="prd-fs__title-brand">{t("brand")}</span>
            <span className="prd-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="prd-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="prd-fs__stage" aria-hidden>
          <div className="prd-fs__scene">
            <div className="prd-fs__workspace animation-workspace">
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

        <div className="prd-fs__footer">
          <button type="button" className="prd-fs__cta" onClick={startTool}>
            {t("getStarted")}
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
