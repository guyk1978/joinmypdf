"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./convert-to-png-landing.css";

type IntroPhase = "intro" | "workspace";

type ConvertToPngIntroGateProps = {
  /** When false, children render immediately (non–convert-to-png tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert Image to PNG.
 * Image card → rendering beam dissolves solid bg → transparency grid + .png badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function ConvertToPngIntroGate({
  active = true,
  children,
}: ConvertToPngIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ConvertToPngLanding");
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

    document.documentElement.setAttribute("data-convert-to-png-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-convert-to-png-intro");
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
        className="i2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="i2p-fs-title"
      >
        <header className="i2p-fs__header">
          <h1 id="i2p-fs-title" className="i2p-fs__title">
            <span className="i2p-fs__title-brand">{t("brand")}</span>
            <span className="i2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="i2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="i2p-fs__stage" aria-hidden>
          <div className="i2p-fs__scene">
            <div className="i2p-fs__workspace animation-workspace">
              <div className="i2p-fs__card">
                <div className="i2p-fs__photo">
                  <div className="i2p-fs__checker" />
                  <div className="i2p-fs__solid" />
                  <div className="i2p-fs__subject" />
                  <div className="i2p-fs__beam" />
                </div>

                <div className="i2p-fs__meta">
                  <span className="i2p-fs__badge">{t("pngBadge")}</span>
                  <span className="i2p-fs__name">{t("fileName")}</span>
                </div>
              </div>

              <span className="i2p-fs__ok">
                <span className="i2p-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="i2p-fs__footer">
          <button type="button" className="i2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="i2p-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
