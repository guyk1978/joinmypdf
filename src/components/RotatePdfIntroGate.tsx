"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./rotate-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type RotatePdfIntroGateProps = {
  /** When false, children render immediately (non–rotate-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Rotate PDF Online.
 * Sideways page → 90° CW glow arc → upright portrait + angle badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function RotatePdfIntroGate({
  active = true,
  children,
}: RotatePdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("RotatePdfLanding");
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

    document.documentElement.setAttribute("data-rotate-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-rotate-pdf-intro");
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
        className="rtp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rtp-fs-title"
      >
        <header className="rtp-fs__header">
          <h1 id="rtp-fs-title" className="rtp-fs__title">
            <span className="rtp-fs__title-brand">{t("brand")}</span>
            <span className="rtp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rtp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rtp-fs__stage" aria-hidden>
          <div className="rtp-fs__scene">
            <div className="rtp-fs__workspace animation-workspace" data-splash-wide>
              <div className="rtp-fs__card">
                <div className="rtp-fs__badges">
                  <span className="rtp-fs__badge rtp-fs__badge--dir">{t("direction")}</span>
                  <span className="rtp-fs__badge rtp-fs__badge--angle">{t("angleBadge")}</span>
                </div>

                <div className="rtp-fs__canvas">
                  <div className="rtp-fs__orbit">
                    <span className="rtp-fs__arc" />
                    <span className="rtp-fs__arrow" />
                  </div>

                  <div className="rtp-fs__page">
                    <span className="rtp-fs__page-mark">PDF</span>
                    <span className="rtp-fs__line rtp-fs__line--title" />
                    <span className="rtp-fs__line" />
                    <span className="rtp-fs__line rtp-fs__line--short" />
                    <span className="rtp-fs__line" />
                    <span className="rtp-fs__line rtp-fs__line--mid" />
                  </div>
                </div>
              </div>

              <span className="rtp-fs__ok">
                <span className="rtp-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="rtp-fs__footer">
          <button type="button" className="rtp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="rtp-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
