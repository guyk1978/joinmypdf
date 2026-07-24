"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp3-to-mp4-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp3ToMp4IntroGateProps = {
  /** When false, children render immediately (non–mp3-to-mp4 tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 to MP4.
 * MP3 EQ card → laser wrap pipeline → MP4 player with cover art + Wrapped to MP4.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function Mp3ToMp4IntroGate({
  active = true,
  children,
}: Mp3ToMp4IntroGateProps) {
  const introActive = active;
  const t = useTranslations("Mp3ToMp4Landing");
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

    document.documentElement.setAttribute("data-mp3-to-mp4-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp3-to-mp4-intro");
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
        className="m34-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m34-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="m34-fs__header">
          <h1 id="m34-fs-title" className="m34-fs__title">
            <span className="m34-fs__title-brand">{t("brand")}</span>
            <span className="m34-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="m34-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="m34-fs__stage" aria-hidden>
          <div className="m34-fs__scene">
            <div className="m34-fs__workspace animation-workspace">
              <div className="m34-fs__card">
                <div className="m34-fs__panels">
                  <div className="m34-fs__panel m34-fs__panel--audio">
                    <span className="m34-fs__tag m34-fs__tag--mp3">{t("mp3Tag")}</span>
                    <div className="m34-fs__eq">
                      {Array.from({ length: 12 }, (_, i) => (
                        <span
                          key={i}
                          className="m34-fs__bar"
                          style={{ animationDelay: `${(i % 6) * 0.08}s` }}
                        />
                      ))}
                    </div>
                    <span className="m34-fs__panel-hint">{t("audioHint")}</span>
                  </div>

                  <div className="m34-fs__pipe">
                    <span className="m34-fs__pipe-line" />
                    <span className="m34-fs__pipe-core" />
                    <span className="m34-fs__laser" />
                  </div>

                  <div className="m34-fs__panel m34-fs__panel--video">
                    <span className="m34-fs__tag m34-fs__tag--mp4">{t("mp4Tag")}</span>
                    <div className="m34-fs__player">
                      <span className="m34-fs__chrome">
                        <span className="m34-fs__dot" />
                        <span className="m34-fs__dot" />
                        <span className="m34-fs__dot" />
                      </span>
                      <span className="m34-fs__cover" />
                      <span className="m34-fs__play" />
                    </div>
                    <span className="m34-fs__panel-hint">{t("videoHint")}</span>
                  </div>
                </div>

                <div className="m34-fs__pills">
                  <span className="m34-fs__pill m34-fs__pill--audio">{t("audioPill")}</span>
                  <span className="m34-fs__pill m34-fs__pill--cover">{t("coverPill")}</span>
                  <span className="m34-fs__pill m34-fs__pill--video">{t("videoPill")}</span>
                </div>

                <span className="m34-fs__particle m34-fs__particle--1" />
                <span className="m34-fs__particle m34-fs__particle--2" />
                <span className="m34-fs__particle m34-fs__particle--3" />
                <span className="m34-fs__particle m34-fs__particle--4" />
              </div>

              <span className="m34-fs__ok">
                <span className="m34-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="m34-fs__footer">
          <button type="button" className="m34-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="m34-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
