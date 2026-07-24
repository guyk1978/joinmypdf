"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./annotate-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type AnnotatePdfIntroGateProps = {
  /** When false, children render immediately (non–annotate-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Annotate PDF.
 * Highlights, freehand ink, and sticky notes appear and lock onto a PDF page.
 * Only runs inside the ToolModal CALC embed.
 */
export function AnnotatePdfIntroGate({
  active = true,
  children,
}: AnnotatePdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("AnnotatePdfLanding");
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

    document.documentElement.setAttribute("data-annotate-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-annotate-pdf-intro");
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
        className="ann-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ann-fs__header">
          <h1 id="ann-fs-title" className="ann-fs__title">
            <span className="ann-fs__title-brand">{t("brand")}</span>
            <span className="ann-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ann-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ann-fs__stage" aria-hidden>
          <div className="ann-fs__scene">
            <div
              className="ann-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ann-fs__card">
                <div className="ann-fs__badges">
                  <span className="ann-fs__badge ann-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="ann-fs__arrow" />
                  <span className="ann-fs__badge ann-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="ann-fs__stage-art">
                  <div className="ann-fs__doc">
                    <span className="ann-fs__fold" />
                    <span className="ann-fs__mark">{t("pdfBadge")}</span>
                    <span className="ann-fs__bar" />
                    <span className="ann-fs__line" />
                    <span className="ann-fs__line ann-fs__line--short" />
                    <span className="ann-fs__line" />
                    <span className="ann-fs__highlight" />
                    <span className="ann-fs__ink" />
                    <span className="ann-fs__sticky">
                      <span className="ann-fs__sticky-fold" />
                    </span>
                  </div>
                </div>

                <span className="ann-fs__ok">
                  <span className="ann-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ann-fs__footer">
          <button type="button" className="ann-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ann-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
