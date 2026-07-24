"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-to-gif-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoToGifIntroGateProps = {
  /** When false, children render immediately (non–video-to-gif tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video to GIF.
 * Video clip player → looping GIF frame with .GIF badge + Converted status.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoToGifIntroGate({
  active = true,
  children,
}: VideoToGifIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoToGifLanding");
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

    document.documentElement.setAttribute("data-video-to-gif-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-to-gif-intro");
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
        className="vtg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtg-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="vtg-fs__header">
          <h1 id="vtg-fs-title" className="vtg-fs__title">
            <span className="vtg-fs__title-brand">{t("brand")}</span>
            <span className="vtg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vtg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vtg-fs__stage" aria-hidden>
          <div className="vtg-fs__scene">
            <div
              className="vtg-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="vtg-fs__card">
                <div className="vtg-fs__badges">
                  <span className="vtg-fs__badge vtg-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="vtg-fs__arrow" />
                  <span className="vtg-fs__badge vtg-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="vtg-fs__stage-art">
                  <div className="vtg-fs__media">
                    <div className="vtg-fs__video">
                      <span className="vtg-fs__play" />
                      <span className="vtg-fs__scrub" />
                      <span className="vtg-fs__fmt vtg-fs__fmt--mp4">{t("videoFmt")}</span>
                    </div>
                    <div className="vtg-fs__gif">
                      <span className="vtg-fs__gif-frame vtg-fs__gif-frame--a" />
                      <span className="vtg-fs__gif-frame vtg-fs__gif-frame--b" />
                      <span className="vtg-fs__gif-frame vtg-fs__gif-frame--c" />
                      <span className="vtg-fs__fmt vtg-fs__fmt--gif">{t("gifFmt")}</span>
                    </div>
                  </div>
                </div>

                <span className="vtg-fs__ok">
                  <span className="vtg-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="vtg-fs__footer">
          <button type="button" className="vtg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="vtg-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
