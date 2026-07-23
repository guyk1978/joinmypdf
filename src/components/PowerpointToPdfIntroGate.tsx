"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./powerpoint-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type PowerpointToPdfIntroGateProps = {
  /** When false, children render immediately (non–powerpoint-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PowerPoint to PDF Online.
 * Widescreen PPTX slides stack and convert into a polished PDF booklet.
 * Only runs inside the ToolModal CALC embed.
 */
export function PowerpointToPdfIntroGate({
  active = true,
  children,
}: PowerpointToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PowerpointToPdfLanding");
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

    document.documentElement.setAttribute("data-powerpoint-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-powerpoint-to-pdf-intro");
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
        className="ppd-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ppd-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ppd-fs__header">
          <h1 id="ppd-fs-title" className="ppd-fs__title">
            <span className="ppd-fs__title-brand">{t("brand")}</span>
            <span className="ppd-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ppd-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ppd-fs__stage" aria-hidden>
          <div className="ppd-fs__scene">
            <div
              className="ppd-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ppd-fs__card">
                <div className="ppd-fs__badges">
                  <span className="ppd-fs__badge ppd-fs__badge--pptx">{t("pptxBadge")}</span>
                  <span className="ppd-fs__arrow" />
                  <span className="ppd-fs__badge ppd-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="ppd-fs__stage-art">
                  <div className="ppd-fs__deck">
                    <div className="ppd-fs__slide ppd-fs__slide--1">
                      <span className="ppd-fs__slide-num">1</span>
                      <span className="ppd-fs__slide-bar" />
                      <span className="ppd-fs__slide-line" />
                      <span className="ppd-fs__slide-line ppd-fs__slide-line--short" />
                    </div>
                    <div className="ppd-fs__slide ppd-fs__slide--2">
                      <span className="ppd-fs__slide-num">2</span>
                      <span className="ppd-fs__slide-grid">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                    <div className="ppd-fs__slide ppd-fs__slide--3">
                      <span className="ppd-fs__slide-num">3</span>
                      <span className="ppd-fs__slide-bar ppd-fs__slide-bar--wide" />
                      <span className="ppd-fs__slide-dot" />
                      <span className="ppd-fs__slide-dot" />
                      <span className="ppd-fs__slide-dot" />
                    </div>
                  </div>

                  <div className="ppd-fs__pdf">
                    <span className="ppd-fs__pdf-fold" />
                    <span className="ppd-fs__pdf-mark">{t("pdfBadge")}</span>
                    <span className="ppd-fs__pdf-title">{t("docTitle")}</span>
                    <div className="ppd-fs__pages">
                      <span className="ppd-fs__page ppd-fs__page--1" />
                      <span className="ppd-fs__page ppd-fs__page--2" />
                      <span className="ppd-fs__page ppd-fs__page--3" />
                    </div>
                    <div className="ppd-fs__binds">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <span className="ppd-fs__beam" />
                </div>

                <span className="ppd-fs__ok">
                  <span className="ppd-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ppd-fs__footer">
          <button type="button" className="ppd-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ppd-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
