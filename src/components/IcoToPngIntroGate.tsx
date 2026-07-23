"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./ico-to-png-landing.css";

type IntroPhase = "intro" | "workspace";

type IcoToPngIntroGateProps = {
  /** When false, children render immediately (non–ico-to-png tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free ICO to PNG Converter.
 * Multi-size ICO card → cursor hover → icon pops into sharp .png asset.
 * Only runs inside the ToolModal CALC embed.
 */
export function IcoToPngIntroGate({
  active = true,
  children,
}: IcoToPngIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("IcoToPngLanding");
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

    document.documentElement.setAttribute("data-ico-to-png-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-ico-to-png-intro");
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
        className="icp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="icp-fs-title"
      >
        <header className="icp-fs__header">
          <h1 id="icp-fs-title" className="icp-fs__title">
            <span className="icp-fs__title-brand">{t("brand")}</span>
            <span className="icp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="icp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="icp-fs__stage" aria-hidden>
          <div className="icp-fs__scene">
            <div className="icp-fs__workspace animation-workspace">
              <div className="icp-fs__ico">
                <div className="icp-fs__ico-sheet">
                  <span className="icp-fs__ico-badge">{t("icoBadge")}</span>
                  <div className="icp-fs__sizes">
                    <span className="icp-fs__size icp-fs__size--sm" />
                    <span className="icp-fs__size icp-fs__size--md" />
                    <span className="icp-fs__size icp-fs__size--lg" />
                    <span className="icp-fs__size icp-fs__size--xl" />
                  </div>
                  <span className="icp-fs__size-label">{t("sizesLabel")}</span>
                </div>
                <span className="icp-fs__ico-name">{t("icoName")}</span>
                <span className="icp-fs__cursor" />
              </div>

              <div className="icp-fs__shards">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="icp-fs__png">
                <div className="icp-fs__png-card">
                  <div className="icp-fs__png-art" />
                  <span className="icp-fs__png-badge">{t("pngBadge")}</span>
                </div>
                <span className="icp-fs__ok">
                  <span className="icp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="icp-fs__footer">
          <button type="button" className="icp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="icp-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
