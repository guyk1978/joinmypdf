"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp4-to-mp3-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp4ToMp3IntroGateProps = {
  /** When false, children render immediately (non–mp4-to-mp3 tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP4 to MP3.
 * Video card → pulsing waveform extracts → MP3 card with bitrate badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function Mp4ToMp3IntroGate({
  active = true,
  children,
}: Mp4ToMp3IntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("Mp4ToMp3Landing");
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

    document.documentElement.setAttribute("data-mp4-mp3-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp4-mp3-intro");
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
        className="m43-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m43-fs-title"
      >
        <header className="m43-fs__header">
          <h1 id="m43-fs-title" className="m43-fs__title">
            <span className="m43-fs__title-brand">{t("brand")}</span>
            <span className="m43-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="m43-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="m43-fs__stage" aria-hidden>
          <div className="m43-fs__scene">
            <div className="m43-fs__workspace animation-workspace">
              <div className="m43-fs__card m43-fs__card--mp4">
                <div className="m43-fs__preview">
                  <span className="m43-fs__preview-sky" />
                  <span className="m43-fs__preview-hill" />
                  <span className="m43-fs__preview-play" />
                </div>
                <div className="m43-fs__card-body">
                  <span className="m43-fs__ext">MP4</span>
                  <span className="m43-fs__fname">{t("mp4Name")}</span>
                </div>
              </div>

              <div className="m43-fs__bridge">
                <div className="m43-fs__wave">
                  {Array.from({ length: 12 }, (_, i) => (
                    <span
                      key={i}
                      className="m43-fs__bar"
                      style={{ ["--i" as string]: String(i) }}
                    />
                  ))}
                </div>
                <div className="m43-fs__spark" />
                <div className="m43-fs__arrow" />
              </div>

              <div className="m43-fs__card m43-fs__card--mp3">
                <div className="m43-fs__audio-art">
                  <span className="m43-fs__note" />
                  <span className="m43-fs__badge">{t("bitrate")}</span>
                </div>
                <div className="m43-fs__card-body">
                  <span className="m43-fs__ext m43-fs__ext--mp3">MP3</span>
                  <span className="m43-fs__fname">{t("mp3Name")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="m43-fs__footer">
          <button type="button" className="m43-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="m43-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
