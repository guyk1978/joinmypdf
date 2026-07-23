"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./favicon-pack-landing.css";

type IntroPhase = "intro" | "workspace";

type FaviconPackIntroGateProps = {
  /** When false, children render immediately (non–favicon-pack tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Favicon Pack Generator.
 * Master logo → scan → icons fan into ZIP pack + size badge + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function FaviconPackIntroGate({
  active = true,
  children,
}: FaviconPackIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FaviconPackLanding");
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

    document.documentElement.setAttribute("data-favicon-pack-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-favicon-pack-intro");
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
        className="fpk-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fpk-fs-title"
      >
        <header className="fpk-fs__header">
          <h1 id="fpk-fs-title" className="fpk-fs__title">
            <span className="fpk-fs__title-brand">{t("brand")}</span>
            <span className="fpk-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="fpk-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="fpk-fs__stage" aria-hidden>
          <div className="fpk-fs__scene">
            <div className="fpk-fs__workspace animation-workspace">
              <div className="fpk-fs__pair">
                <div className="fpk-fs__master">
                  <div className="fpk-fs__logo">
                    <span className="fpk-fs__logo-mark" />
                  </div>
                  <span className="fpk-fs__master-label">{t("masterLabel")}</span>
                  <div className="fpk-fs__scan" />
                </div>

                <div className="fpk-fs__pack">
                  <div className="fpk-fs__zip">
                    <span className="fpk-fs__zip-fold" />
                    <span className="fpk-fs__zip-badge">{t("zipBadge")}</span>
                  </div>
                  <span className="fpk-fs__pack-size">{t("packSize")}</span>
                </div>
              </div>

              <div className="fpk-fs__fan">
                <span className="fpk-fs__chip fpk-fs__chip--ios">{t("iosChip")}</span>
                <span className="fpk-fs__chip fpk-fs__chip--and">{t("androidChip")}</span>
                <span className="fpk-fs__chip fpk-fs__chip--ico">{t("icoChip")}</span>
                <span className="fpk-fs__chip fpk-fs__chip--png">{t("pngChip")}</span>
              </div>

              <span className="fpk-fs__ok">
                <span className="fpk-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="fpk-fs__footer">
          <button type="button" className="fpk-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="fpk-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
