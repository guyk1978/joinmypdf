"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./resize-image-landing.css";

type IntroPhase = "intro" | "workspace";

type ResizeImageIntroGateProps = {
  /** When false, children render immediately (non–resize-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Resize Image.
 * Preview card with handles scales; dimension badges update with the motion.
 * Only runs inside the ToolModal CALC embed.
 */
export function ResizeImageIntroGate({
  active = true,
  children,
}: ResizeImageIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ResizeImageLanding");
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

    document.documentElement.setAttribute("data-resize-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-resize-intro");
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
        className="riz-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="riz-fs-title"
      >
        <header className="riz-fs__header">
          <h1 id="riz-fs-title" className="riz-fs__title">
            <span className="riz-fs__title-brand">{t("brand")}</span>
            <span className="riz-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="riz-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="riz-fs__stage" aria-hidden>
          <div className="riz-fs__scene">
            <div className="riz-fs__workspace">
              <div className="riz-fs__guides" />

              <div className="riz-fs__preview">
                <div className="riz-fs__photo">
                  <span className="riz-fs__photo-sky" />
                  <span className="riz-fs__photo-hill" />
                  <span className="riz-fs__photo-sun" />
                </div>

                <span className="riz-fs__handle riz-fs__handle--nw" />
                <span className="riz-fs__handle riz-fs__handle--ne" />
                <span className="riz-fs__handle riz-fs__handle--sw" />
                <span className="riz-fs__handle riz-fs__handle--se" />
                <span className="riz-fs__edge riz-fs__edge--t" />
                <span className="riz-fs__edge riz-fs__edge--r" />
                <span className="riz-fs__edge riz-fs__edge--b" />
                <span className="riz-fs__edge riz-fs__edge--l" />
              </div>

              <div className="riz-fs__badges">
                <div className="riz-fs__badge riz-fs__badge--px">
                  <span className="riz-fs__badge-a">{t("sizeLarge")}</span>
                  <span className="riz-fs__badge-b">{t("sizeSmall")}</span>
                </div>
                <div className="riz-fs__badge riz-fs__badge--pct">
                  <span className="riz-fs__badge-a">{t("pctFull")}</span>
                  <span className="riz-fs__badge-b">{t("pctHalf")}</span>
                </div>
              </div>
            </div>

            <p className="riz-fs__caption">{t("caption")}</p>
          </div>
        </div>

        <div className="riz-fs__footer">
          <button type="button" className="riz-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="riz-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
