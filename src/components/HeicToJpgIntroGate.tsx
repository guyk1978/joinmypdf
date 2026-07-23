"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./heic-to-jpg-landing.css";

type IntroPhase = "intro" | "workspace";

type HeicToJpgIntroGateProps = {
  /** When false, children render immediately (non–heic-to-jpg tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert HEIC to JPG.
 * Image card with .heic badge → glowing conversion beam → .jpg swap + compat unlock.
 * Only runs inside the ToolModal CALC embed.
 */
export function HeicToJpgIntroGate({
  active = true,
  children,
}: HeicToJpgIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("HeicToJpgLanding");
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

    document.documentElement.setAttribute("data-heic-to-jpg-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-heic-to-jpg-intro");
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
        className="h2j-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="h2j-fs-title"
      >
        <header className="h2j-fs__header">
          <h1 id="h2j-fs-title" className="h2j-fs__title">
            <span className="h2j-fs__title-brand">{t("brand")}</span>
            <span className="h2j-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="h2j-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="h2j-fs__stage" aria-hidden>
          <div className="h2j-fs__scene">
            <div className="h2j-fs__workspace animation-workspace">
              <div className="h2j-fs__particles">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="h2j-fs__card">
                <div className="h2j-fs__photo">
                  <div className="h2j-fs__sky" />
                  <div className="h2j-fs__hills" />
                  <div className="h2j-fs__glow" />
                  <div className="h2j-fs__beam" />
                  <div className="h2j-fs__sync" />
                </div>

                <div className="h2j-fs__meta">
                  <div className="h2j-fs__badges">
                    <span className="h2j-fs__badge h2j-fs__badge--heic">{t("heicBadge")}</span>
                    <span className="h2j-fs__badge h2j-fs__badge--jpg">{t("jpgBadge")}</span>
                  </div>
                  <div className="h2j-fs__names">
                    <span className="h2j-fs__name h2j-fs__name--heic">{t("heicName")}</span>
                    <span className="h2j-fs__name h2j-fs__name--jpg">{t("jpgName")}</span>
                  </div>
                </div>
              </div>

              <div className="h2j-fs__compat">
                <span className="h2j-fs__chip">{t("compatWindows")}</span>
                <span className="h2j-fs__chip">{t("compatAndroid")}</span>
                <span className="h2j-fs__chip">{t("compatWeb")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h2j-fs__footer">
          <button type="button" className="h2j-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="h2j-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
