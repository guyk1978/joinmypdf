"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./flip-image-landing.css";

type IntroPhase = "intro" | "workspace";

type FlipImageIntroGateProps = {
  /** When false, children render immediately (non–flip-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Flip Image.
 * Preview card flips horizontally then vertically with H/V axis cues.
 * Only runs inside the ToolModal CALC embed.
 */
export function FlipImageIntroGate({
  active = true,
  children,
}: FlipImageIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FlipImageLanding");
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

    document.documentElement.setAttribute("data-flip-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-flip-intro");
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
        className="flp-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flp-fs-title"
      >
        <header className="flp-fs__header">
          <h1 id="flp-fs-title" className="flp-fs__title">
            <span className="flp-fs__title-brand">{t("brand")}</span>
            <span className="flp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="flp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="flp-fs__stage" aria-hidden>
          <div className="flp-fs__scene">
            <div className="flp-fs__axes">
              <span className="flp-fs__axis flp-fs__axis--h">{t("axisH")}</span>
              <span className="flp-fs__axis flp-fs__axis--v">{t("axisV")}</span>
            </div>

            <div className="flp-fs__workspace">
              <div className="flp-fs__arrow flp-fs__arrow--h" />
              <div className="flp-fs__arrow flp-fs__arrow--v" />

              <div className="flp-fs__card">
                <div className="flp-fs__face">
                  <span className="flp-fs__mark flp-fs__mark--tl">A</span>
                  <span className="flp-fs__mark flp-fs__mark--tr">B</span>
                  <span className="flp-fs__mark flp-fs__mark--bl">C</span>
                  <span className="flp-fs__mark flp-fs__mark--br">D</span>
                  <div className="flp-fs__photo">
                    <span className="flp-fs__photo-sky" />
                    <span className="flp-fs__photo-hill" />
                    <span className="flp-fs__photo-sun" />
                    <span className="flp-fs__photo-tree" />
                  </div>
                </div>
              </div>
            </div>

            <p className="flp-fs__caption">
              <span className="flp-fs__caption-h">{t("captionH")}</span>
              <span className="flp-fs__caption-v">{t("captionV")}</span>
            </p>
          </div>
        </div>

        <div className="flp-fs__footer">
          <button type="button" className="flp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="flp-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
