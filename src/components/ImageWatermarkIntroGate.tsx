"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./image-watermark-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageWatermarkIntroGateProps = {
  /** When false, children render immediately (non–image-watermark tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Professional Image Watermark.
 * Semi-transparent © badge glides onto the photo and settles with glow; shield + opacity cues.
 * Only runs inside the ToolModal CALC embed.
 */
export function ImageWatermarkIntroGate({
  active = true,
  children,
}: ImageWatermarkIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ImageWatermarkLanding");
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

    document.documentElement.setAttribute("data-watermark-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-watermark-intro");
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
        className="wmk-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wmk-fs-title"
      >
        <header className="wmk-fs__header">
          <h1 id="wmk-fs-title" className="wmk-fs__title">
            <span className="wmk-fs__title-brand">{t("brand")}</span>
            <span className="wmk-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="wmk-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="wmk-fs__stage" aria-hidden>
          <div className="wmk-fs__scene">
            <div className="wmk-fs__cues">
              <div className="wmk-fs__shield" title={t("shield")}>
                <span className="wmk-fs__shield-icon" />
                <span className="wmk-fs__shield-label">{t("protected")}</span>
              </div>
              <div className="wmk-fs__opacity" title={t("opacity")}>
                <span className="wmk-fs__opacity-track">
                  <span className="wmk-fs__opacity-fill" />
                  <span className="wmk-fs__opacity-thumb" />
                </span>
                <span className="wmk-fs__opacity-pct">45%</span>
              </div>
            </div>

            <div className="wmk-fs__workspace">
              <div className="wmk-fs__card">
                <div className="wmk-fs__photo">
                  <span className="wmk-fs__photo-sky" />
                  <span className="wmk-fs__photo-hill" />
                  <span className="wmk-fs__photo-sun" />
                  <span className="wmk-fs__photo-tree" />
                </div>

                <div className="wmk-fs__mark">
                  <span className="wmk-fs__mark-logo" aria-hidden>
                    <span className="wmk-fs__mark-mono" />
                  </span>
                  <span className="wmk-fs__mark-text">{t("watermark")}</span>
                </div>

                <div className="wmk-fs__cursor">
                  <span className="wmk-fs__cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="wmk-fs__footer">
          <button type="button" className="wmk-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="wmk-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
