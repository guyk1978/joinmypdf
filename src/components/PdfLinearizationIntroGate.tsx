"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./pdf-linearization-landing.css";

type IntroPhase = "intro" | "workspace";

type PdfLinearizationIntroGateProps = {
  /** When false, children render immediately (non–pdf-linearization tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF Linearization (Fast Web View).
 * A standard PDF restructures for progressive streaming — page one pops open in a browser viewer.
 * Only runs inside the ToolModal CALC embed.
 */
export function PdfLinearizationIntroGate({
  active = true,
  children,
}: PdfLinearizationIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PdfLinearizationLanding");
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

    document.documentElement.setAttribute("data-pdf-linearization-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-linearization-intro");
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
        className="lin-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lin-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="lin-fs__header">
          <h1 id="lin-fs-title" className="lin-fs__title">
            <span className="lin-fs__title-brand">{t("brand")}</span>
            <span className="lin-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="lin-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="lin-fs__stage" aria-hidden>
          <div className="lin-fs__scene">
            <div
              className="lin-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="lin-fs__card">
                <div className="lin-fs__badges">
                  <span className="lin-fs__badge lin-fs__badge--std">{t("stdBadge")}</span>
                  <span className="lin-fs__arrow" />
                  <span className="lin-fs__badge lin-fs__badge--fast">{t("fastBadge")}</span>
                </div>

                <div className="lin-fs__stage-art">
                  <div className="lin-fs__pdf">
                    <span className="lin-fs__pdf-fold" />
                    <span className="lin-fs__pdf-mark">{t("pdfBadge")}</span>
                    <div className="lin-fs__index">
                      <span className="lin-fs__index-row lin-fs__index-row--1" />
                      <span className="lin-fs__index-row lin-fs__index-row--2" />
                      <span className="lin-fs__index-row lin-fs__index-row--3" />
                      <span className="lin-fs__index-row lin-fs__index-row--4" />
                    </div>
                    <span className="lin-fs__stream" />
                  </div>

                  <div className="lin-fs__browser">
                    <div className="lin-fs__chrome">
                      <span className="lin-fs__dot" />
                      <span className="lin-fs__dot" />
                      <span className="lin-fs__dot" />
                      <span className="lin-fs__url">{t("urlLabel")}</span>
                    </div>
                    <div className="lin-fs__viewport">
                      <div className="lin-fs__page">
                        <span className="lin-fs__page-num">1</span>
                        <span className="lin-fs__page-bar" />
                        <span className="lin-fs__page-line" />
                        <span className="lin-fs__page-line lin-fs__page-line--short" />
                      </div>
                      <span className="lin-fs__loader" />
                    </div>
                  </div>
                </div>

                <span className="lin-fs__ok">
                  <span className="lin-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lin-fs__footer">
          <button type="button" className="lin-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="lin-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
