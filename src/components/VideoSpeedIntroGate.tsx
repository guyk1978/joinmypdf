"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./video-speed-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoSpeedIntroGateProps = {
  /** When false, children render immediately (non–video-speed tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Speed Controller.
 * Player + speed dial cycles 0.5x slow-mo → 1x → 2x timelapse with motion cues.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoSpeedIntroGate({
  active = true,
  children,
}: VideoSpeedIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoSpeedLanding");
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

    document.documentElement.setAttribute("data-video-speed-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-speed-intro");
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
        className="vsp-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vsp-fs-title"
      >
        <header className="vsp-fs__header">
          <h1 id="vsp-fs-title" className="vsp-fs__title">
            <span className="vsp-fs__title-brand">{t("brand")}</span>
            <span className="vsp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vsp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vsp-fs__stage" aria-hidden>
          <div className="vsp-fs__scene">
            <div className="vsp-fs__rates">
              <span className="vsp-fs__rate vsp-fs__rate--slow">{t("rate05")}</span>
              <span className="vsp-fs__rate vsp-fs__rate--normal">{t("rate1")}</span>
              <span className="vsp-fs__rate vsp-fs__rate--fast">{t("rate2")}</span>
            </div>

            <div className="vsp-fs__player">
              <div className="vsp-fs__screen">
                <span className="vsp-fs__screen-sky" />
                <span className="vsp-fs__screen-hill" />
                <span className="vsp-fs__screen-sun" />
                <span className="vsp-fs__ghost vsp-fs__ghost--1" />
                <span className="vsp-fs__ghost vsp-fs__ghost--2" />
                <span className="vsp-fs__streaks">
                  <i /><i /><i /><i /><i />
                </span>
                <span className="vsp-fs__mode vsp-fs__mode--slow">{t("slowMo")}</span>
                <span className="vsp-fs__mode vsp-fs__mode--fast">{t("timelapse")}</span>
              </div>

              <div className="vsp-fs__controls">
                <div className="vsp-fs__dial">
                  <div className="vsp-fs__dial-face">
                    <span className="vsp-fs__tick vsp-fs__tick--l" />
                    <span className="vsp-fs__tick vsp-fs__tick--c" />
                    <span className="vsp-fs__tick vsp-fs__tick--r" />
                    <span className="vsp-fs__needle" />
                    <span className="vsp-fs__dial-hub" />
                  </div>
                  <span className="vsp-fs__dial-value">
                    <span className="vsp-fs__dial-num vsp-fs__dial-num--05">{t("rate05")}</span>
                    <span className="vsp-fs__dial-num vsp-fs__dial-num--1">{t("rate1")}</span>
                    <span className="vsp-fs__dial-num vsp-fs__dial-num--2">{t("rate2")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vsp-fs__footer">
          <button type="button" className="vsp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vsp-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
