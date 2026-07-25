"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./video-muter-landing.css";


type VideoMuterIntroGateProps = {
  /** When false, children render immediately (non–video-muter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Muter.
 * Waveform plays → mute → waves flatten; speaker crosses out; “Audio Removed” badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function VideoMuterIntroGate({
  active = true,
  children,
}: VideoMuterIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-video-mute-intro",
  });
  const t = useTranslations("VideoMuterLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="vmu-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vmu-fs-title"
      >
        <header className="vmu-fs__header">
          <h1 id="vmu-fs-title" className="vmu-fs__title">
            <span className="vmu-fs__title-brand">{t("brand")}</span>
            <span className="vmu-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vmu-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vmu-fs__stage" aria-hidden>
          <div className="vmu-fs__scene">
            <div className="vmu-fs__player">
              <div className="vmu-fs__screen">
                <span className="vmu-fs__screen-sky" />
                <span className="vmu-fs__screen-hill" />
                <span className="vmu-fs__screen-sun" />

                <div className="vmu-fs__speaker">
                  <span className="vmu-fs__speaker-body" />
                  <span className="vmu-fs__speaker-wave vmu-fs__speaker-wave--1" />
                  <span className="vmu-fs__speaker-wave vmu-fs__speaker-wave--2" />
                  <span className="vmu-fs__speaker-slash" />
                </div>

                <div className="vmu-fs__badge">{t("audioRemoved")}</div>
              </div>

              <div className="vmu-fs__wavebar">
                <div className="vmu-fs__wave">
                  {Array.from({ length: 28 }, (_, i) => (
                    <span
                      key={i}
                      className="vmu-fs__bar"
                      style={{ ["--i" as string]: String(i) }}
                    />
                  ))}
                </div>
                <span className="vmu-fs__wave-label vmu-fs__wave-label--on">{t("audioOn")}</span>
                <span className="vmu-fs__wave-label vmu-fs__wave-label--off">{t("audioOff")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vmu-fs__footer">
          <button type="button" className="vmu-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vmu-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
