"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./webp-to-jpg-landing.css";

type IntroPhase = "intro" | "workspace";

type WebpToJpgIntroGateProps = {
  /** When false, children render immediately (non–webp-to-jpg tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert WebP to JPG.
 * Image card with .webp badge → compatibility ray → .jpg swap + browser unlock.
 * Only runs inside the ToolModal CALC embed.
 */
export function WebpToJpgIntroGate({
  active = true,
  children,
}: WebpToJpgIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("WebpToJpgLanding");
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

    document.documentElement.setAttribute("data-webp-to-jpg-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-webp-to-jpg-intro");
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
        className="w2j-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="w2j-fs-title"
      >
        <header className="w2j-fs__header">
          <h1 id="w2j-fs-title" className="w2j-fs__title">
            <span className="w2j-fs__title-brand">{t("brand")}</span>
            <span className="w2j-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="w2j-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="w2j-fs__stage" aria-hidden>
          <div className="w2j-fs__scene">
            <div className="w2j-fs__workspace animation-workspace">
              <div className="w2j-fs__particles">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="w2j-fs__card">
                <div className="w2j-fs__photo">
                  <div className="w2j-fs__sky" />
                  <div className="w2j-fs__shapes" />
                  <div className="w2j-fs__ray" />
                  <div className="w2j-fs__pulse" />
                </div>

                <div className="w2j-fs__meta">
                  <div className="w2j-fs__badges">
                    <span className="w2j-fs__badge w2j-fs__badge--webp">{t("webpBadge")}</span>
                    <span className="w2j-fs__badge w2j-fs__badge--jpg">{t("jpgBadge")}</span>
                  </div>
                  <div className="w2j-fs__names">
                    <span className="w2j-fs__name w2j-fs__name--webp">{t("webpName")}</span>
                    <span className="w2j-fs__name w2j-fs__name--jpg">{t("jpgName")}</span>
                  </div>
                </div>
              </div>

              <div className="w2j-fs__compat">
                <span className="w2j-fs__chip">{t("compatSafari")}</span>
                <span className="w2j-fs__chip">{t("compatEmail")}</span>
                <span className="w2j-fs__chip">{t("compatApps")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w2j-fs__footer">
          <button type="button" className="w2j-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="w2j-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
