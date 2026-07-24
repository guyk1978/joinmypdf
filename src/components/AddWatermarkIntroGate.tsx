"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./add-watermark-landing.css";

type IntroPhase = "intro" | "workspace";

type AddWatermarkIntroGateProps = {
  /** When false, children render immediately (non–add-watermark tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Add Watermark.
 * A semi-transparent text stamp rotates and imprints across a PDF page.
 * Only runs inside the ToolModal CALC embed.
 */
export function AddWatermarkIntroGate({
  active = true,
  children,
}: AddWatermarkIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("AddWatermarkLanding");
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

    document.documentElement.setAttribute("data-add-watermark-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-add-watermark-intro");
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
        className="awm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="awm-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="awm-fs__header">
          <h1 id="awm-fs-title" className="awm-fs__title">
            <span className="awm-fs__title-brand">{t("brand")}</span>
            <span className="awm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="awm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="awm-fs__stage" aria-hidden>
          <div className="awm-fs__scene">
            <div
              className="awm-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="awm-fs__card">
                <div className="awm-fs__badges">
                  <span className="awm-fs__badge awm-fs__badge--clean">{t("cleanBadge")}</span>
                  <span className="awm-fs__arrow" />
                  <span className="awm-fs__badge awm-fs__badge--marked">{t("markedBadge")}</span>
                </div>

                <div className="awm-fs__stage-art">
                  <div className="awm-fs__doc">
                    <span className="awm-fs__fold" />
                    <span className="awm-fs__mark">{t("pdfBadge")}</span>
                    <span className="awm-fs__bar" />
                    <span className="awm-fs__line" />
                    <span className="awm-fs__line awm-fs__line--short" />
                    <span className="awm-fs__line" />
                    <span className="awm-fs__stamp">{t("stampText")}</span>
                  </div>

                  <div className="awm-fs__stamp-float" aria-hidden>
                    {t("stampText")}
                  </div>
                </div>

                <span className="awm-fs__ok">
                  <span className="awm-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="awm-fs__footer">
          <button type="button" className="awm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="awm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
