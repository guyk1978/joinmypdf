"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./favicon-compressor-landing.css";

type IntroPhase = "intro" | "workspace";

type FaviconCompressorIntroGateProps = {
  /** When false, children render immediately (non–favicon-compressor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Favicon Compressor.
 * Browser tab + glowing favicon → micro-laser grid → size shrink + instant load.
 * Only runs inside the ToolModal CALC embed.
 */
export function FaviconCompressorIntroGate({
  active = true,
  children,
}: FaviconCompressorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FaviconCompressorLanding");
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

    document.documentElement.setAttribute("data-favicon-compress-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-favicon-compress-intro");
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
        className="favc-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favc-fs-title"
      >
        <header className="favc-fs__header">
          <h1 id="favc-fs-title" className="favc-fs__title">
            <span className="favc-fs__title-brand">{t("brand")}</span>
            <span className="favc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="favc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="favc-fs__stage" aria-hidden>
          <div className="favc-fs__scene">
            <div className="favc-fs__workspace">
              <div className="favc-fs__browser">
                <div className="favc-fs__chrome">
                  <div className="favc-fs__dots">
                    <span /><span /><span />
                  </div>
                  <div className="favc-fs__tab">
                    <span className="favc-fs__tab-icon" />
                    <span className="favc-fs__tab-label">{t("tabLabel")}</span>
                  </div>
                </div>

                <div className="favc-fs__loadbar">
                  <span className="favc-fs__loadbar-fill" />
                </div>

                <div className="favc-fs__body">
                  <div className="favc-fs__favicon">
                    <div className="favc-fs__icon-face">
                      <span className="favc-fs__icon-letter">J</span>
                    </div>
                    <div className="favc-fs__grid" />
                    <div className="favc-fs__laser" />
                  </div>

                  <div className="favc-fs__badges">
                    <div className="favc-fs__size">
                      <span className="favc-fs__size-val favc-fs__size-val--a">{t("sizeFrom")}</span>
                      <span className="favc-fs__size-val favc-fs__size-val--b">{t("sizeMid")}</span>
                      <span className="favc-fs__size-val favc-fs__size-val--c">{t("sizeTo")}</span>
                    </div>
                    <span className="favc-fs__speed">{t("speed")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="favc-fs__footer">
          <button type="button" className="favc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="favc-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
