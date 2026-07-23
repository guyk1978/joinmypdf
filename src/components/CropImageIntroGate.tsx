"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./crop-image-landing.css";

type IntroPhase = "intro" | "workspace";

type CropImageIntroGateProps = {
  /** When false, children render immediately (non–crop-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Crop Image.
 * Full preview → crop box contracts → outside fades; cropped region stays focused.
 * Only runs inside the ToolModal CALC embed.
 */
export function CropImageIntroGate({
  active = true,
  children,
}: CropImageIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("CropImageLanding");
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

    document.documentElement.setAttribute("data-crop-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-crop-intro");
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
        className="crp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crp-fs-title"
      >
        <header className="crp-fs__header">
          <h1 id="crp-fs-title" className="crp-fs__title">
            <span className="crp-fs__title-brand">{t("brand")}</span>
            <span className="crp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="crp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="crp-fs__stage" aria-hidden>
          <div className="crp-fs__scene">
            <div className="crp-fs__workspace animation-workspace">
              <div className="crp-fs__photo">
                <span className="crp-fs__photo-sky" />
                <span className="crp-fs__photo-hill" />
                <span className="crp-fs__photo-sun" />
                <span className="crp-fs__photo-tree" />
              </div>

              <div className="crp-fs__crop">
                <span className="crp-fs__handle crp-fs__handle--nw" />
                <span className="crp-fs__handle crp-fs__handle--ne" />
                <span className="crp-fs__handle crp-fs__handle--sw" />
                <span className="crp-fs__handle crp-fs__handle--se" />
                <span className="crp-fs__rule crp-fs__rule--v1" />
                <span className="crp-fs__rule crp-fs__rule--v2" />
                <span className="crp-fs__rule crp-fs__rule--h1" />
                <span className="crp-fs__rule crp-fs__rule--h2" />
              </div>

              <div className="crp-fs__result">
                <span className="crp-fs__result-sky" />
                <span className="crp-fs__result-sun" />
                <span className="crp-fs__result-label">{t("croppedLabel")}</span>
              </div>
            </div>

            <div className="crp-fs__meter">
              <span className="crp-fs__meter-label">{t("progressLabel")}</span>
              <div className="crp-fs__meter-track">
                <span className="crp-fs__meter-fill" />
              </div>
            </div>
          </div>
        </div>

        <div className="crp-fs__footer">
          <button type="button" className="crp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="crp-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
