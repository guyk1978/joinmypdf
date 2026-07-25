"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./favicon-pack-landing.css";


type FaviconPackIntroGateProps = {
  /** When false, children render immediately (non–favicon-pack tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Favicon Pack Generator.
 * Master logo → scan → icons fan into ZIP pack + size badge + success.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function FaviconPackIntroGate({
  active = true,
  children,
}: FaviconPackIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-favicon-pack-intro",
  });
  const t = useTranslations("FaviconPackLanding");

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
