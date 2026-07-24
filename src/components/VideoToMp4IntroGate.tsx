"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-to-mp4-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoToMp4IntroGateProps = {
  /** When false, children render immediately (non–video-to-mp4 tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video to MP4 Converter Online.
 * Raw video file → polished MP4 player with glowing .MP4 badge + Converted status.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoToMp4IntroGate({
  active = true,
  children,
}: VideoToMp4IntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoToMp4Landing");
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

    document.documentElement.setAttribute("data-video-to-mp4-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-to-mp4-intro");
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
        className="vt4-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vt4-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="vt4-fs__header">
          <h1 id="vt4-fs-title" className="vt4-fs__title">
            <span className="vt4-fs__title-brand">{t("brand")}</span>
            <span className="vt4-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vt4-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vt4-fs__stage" aria-hidden>
          <div className="vt4-fs__scene">
            <div
              className="vt4-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="vt4-fs__card">
                <div className="vt4-fs__badges">
                  <span className="vt4-fs__badge vt4-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="vt4-fs__arrow" />
                  <span className="vt4-fs__badge vt4-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="vt4-fs__stage-art">
                  <div className="vt4-fs__media">
                    <div className="vt4-fs__raw">
                      <span className="vt4-fs__file">
                        <span className="vt4-fs__file-fold" />
                        <span className="vt4-fs__file-lines">
                          <span className="vt4-fs__line" />
                          <span className="vt4-fs__line vt4-fs__line--short" />
                        </span>
                      </span>
                      <span className="vt4-fs__fmt vt4-fs__fmt--raw">{t("rawFmt")}</span>
                    </div>
                    <div className="vt4-fs__player">
                      <span className="vt4-fs__screen">
                        <span className="vt4-fs__play" />
                        <span className="vt4-fs__scrub" />
                      </span>
                      <span className="vt4-fs__glow" />
                      <span className="vt4-fs__fmt vt4-fs__fmt--mp4">{t("mp4Fmt")}</span>
                    </div>
                  </div>
                </div>

                <span className="vt4-fs__ok">
                  <span className="vt4-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="vt4-fs__footer">
          <button type="button" className="vt4-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="vt4-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
