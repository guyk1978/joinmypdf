"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-to-mp3-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoToMp3IntroGateProps = {
  /** When false, children render immediately (non–video-to-mp3 tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video to MP3.
 * Video file card → pulsing audio waveform with .MP3 badge + Converted status.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoToMp3IntroGate({
  active = true,
  children,
}: VideoToMp3IntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoToMp3Landing");
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

    document.documentElement.setAttribute("data-video-to-mp3-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-to-mp3-intro");
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
        className="vtm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtm-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="vtm-fs__header">
          <h1 id="vtm-fs-title" className="vtm-fs__title">
            <span className="vtm-fs__title-brand">{t("brand")}</span>
            <span className="vtm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vtm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vtm-fs__stage" aria-hidden>
          <div className="vtm-fs__scene">
            <div
              className="vtm-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="vtm-fs__card">
                <div className="vtm-fs__badges">
                  <span className="vtm-fs__badge vtm-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="vtm-fs__arrow" />
                  <span className="vtm-fs__badge vtm-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="vtm-fs__stage-art">
                  <div className="vtm-fs__media">
                    <div className="vtm-fs__video">
                      <span className="vtm-fs__play" />
                      <span className="vtm-fs__scrub" />
                      <span className="vtm-fs__fmt vtm-fs__fmt--video">{t("videoFmt")}</span>
                    </div>
                    <div className="vtm-fs__audio">
                      <span className="vtm-fs__wave" aria-hidden>
                        <span className="vtm-fs__bar vtm-fs__bar--1" />
                        <span className="vtm-fs__bar vtm-fs__bar--2" />
                        <span className="vtm-fs__bar vtm-fs__bar--3" />
                        <span className="vtm-fs__bar vtm-fs__bar--4" />
                        <span className="vtm-fs__bar vtm-fs__bar--5" />
                        <span className="vtm-fs__bar vtm-fs__bar--6" />
                        <span className="vtm-fs__bar vtm-fs__bar--7" />
                        <span className="vtm-fs__bar vtm-fs__bar--8" />
                        <span className="vtm-fs__bar vtm-fs__bar--9" />
                      </span>
                      <span className="vtm-fs__fmt vtm-fs__fmt--mp3">{t("audioFmt")}</span>
                    </div>
                  </div>
                </div>

                <span className="vtm-fs__ok">
                  <span className="vtm-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="vtm-fs__footer">
          <button type="button" className="vtm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="vtm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
