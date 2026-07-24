"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
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
 * Video container → laser audio extract → MP3 EQ + Extracted to MP3.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function VideoToMp3IntroGate({
  active = true,
  children,
}: VideoToMp3IntroGateProps) {
  const introActive = active;
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
            <div className="vtm-fs__workspace animation-workspace">
              <div className="vtm-fs__card">
                <div className="vtm-fs__panels">
                  <div className="vtm-fs__panel vtm-fs__panel--video">
                    <span className="vtm-fs__tag vtm-fs__tag--video">{t("videoTag")}</span>
                    <div className="vtm-fs__player">
                      <span className="vtm-fs__chrome">
                        <span className="vtm-fs__dot" />
                        <span className="vtm-fs__dot" />
                        <span className="vtm-fs__dot" />
                      </span>
                      <span className="vtm-fs__frame">
                        <span className="vtm-fs__play" />
                        <span className="vtm-fs__scrub" />
                      </span>
                    </div>
                    <span className="vtm-fs__panel-hint">{t("videoHint")}</span>
                  </div>

                  <div className="vtm-fs__pipe">
                    <span className="vtm-fs__pipe-line" />
                    <span className="vtm-fs__pipe-core" />
                    <span className="vtm-fs__laser" />
                  </div>

                  <div className="vtm-fs__panel vtm-fs__panel--audio">
                    <span className="vtm-fs__tag vtm-fs__tag--mp3">{t("mp3Tag")}</span>
                    <div className="vtm-fs__eq">
                      {Array.from({ length: 12 }, (_, i) => (
                        <span
                          key={i}
                          className="vtm-fs__bar"
                          style={{ animationDelay: `${(i % 6) * 0.08}s` }}
                        />
                      ))}
                    </div>
                    <span className="vtm-fs__panel-hint">{t("audioHint")}</span>
                  </div>
                </div>

                <div className="vtm-fs__pills">
                  <span className="vtm-fs__pill vtm-fs__pill--video">{t("videoPill")}</span>
                  <span className="vtm-fs__pill vtm-fs__pill--extract">{t("extractPill")}</span>
                  <span className="vtm-fs__pill vtm-fs__pill--mp3">{t("mp3Pill")}</span>
                </div>

                <span className="vtm-fs__particle vtm-fs__particle--1" />
                <span className="vtm-fs__particle vtm-fs__particle--2" />
                <span className="vtm-fs__particle vtm-fs__particle--3" />
                <span className="vtm-fs__particle vtm-fs__particle--4" />
              </div>

              <span className="vtm-fs__ok">
                <span className="vtm-fs__check" />
                {t("success")}
              </span>
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
