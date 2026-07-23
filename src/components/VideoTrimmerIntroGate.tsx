"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-trimmer-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoTrimmerIntroGateProps = {
  /** When false, children render immediately (non–video-trimmer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Trimmer.
 * Player + filmstrip timeline; trim handles slide inward; playhead sweeps the keep zone.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoTrimmerIntroGate({
  active = true,
  children,
}: VideoTrimmerIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoTrimmerLanding");
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

    document.documentElement.setAttribute("data-video-trim-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-trim-intro");
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
        className="vtr-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtr-fs-title"
      >
        <header className="vtr-fs__header">
          <h1 id="vtr-fs-title" className="vtr-fs__title">
            <span className="vtr-fs__title-brand">{t("brand")}</span>
            <span className="vtr-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vtr-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vtr-fs__stage" aria-hidden>
          <div className="vtr-fs__scene">
            <div className="vtr-fs__player">
              <div className="vtr-fs__screen">
                <span className="vtr-fs__screen-sky" />
                <span className="vtr-fs__screen-hill" />
                <span className="vtr-fs__screen-sun" />
                <span className="vtr-fs__screen-cut vtr-fs__screen-cut--left" />
                <span className="vtr-fs__screen-cut vtr-fs__screen-cut--right" />
                <span className="vtr-fs__play-btn" />
                <span className="vtr-fs__time">{t("timeRange")}</span>
              </div>

              <div className="vtr-fs__timeline">
                <div className="vtr-fs__filmstrip">
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                  <span className="vtr-fs__thumb" />
                </div>

                <div className="vtr-fs__shade vtr-fs__shade--left" />
                <div className="vtr-fs__shade vtr-fs__shade--right" />
                <div className="vtr-fs__selection" />

                <div className="vtr-fs__handle vtr-fs__handle--start" title={t("start")}>
                  <span className="vtr-fs__handle-bar" />
                </div>
                <div className="vtr-fs__handle vtr-fs__handle--end" title={t("end")}>
                  <span className="vtr-fs__handle-bar" />
                </div>

                <div className="vtr-fs__playhead" />
              </div>

              <div className="vtr-fs__labels">
                <span>{t("start")}</span>
                <span className="vtr-fs__labels-keep">{t("keep")}</span>
                <span>{t("end")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vtr-fs__footer">
          <button type="button" className="vtr-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vtr-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
