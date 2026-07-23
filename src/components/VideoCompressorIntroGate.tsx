"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-compressor-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoCompressorIntroGateProps = {
  /** When false, children render immediately (non–video-compressor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Compressor.
 * File card squeezes while size badge counts down; progress ring + savings cue.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoCompressorIntroGate({
  active = true,
  children,
}: VideoCompressorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoCompressorLanding");
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

    document.documentElement.setAttribute("data-video-compress-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-compress-intro");
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
        className="vcp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vcp-fs-title"
      >
        <header className="vcp-fs__header">
          <h1 id="vcp-fs-title" className="vcp-fs__title">
            <span className="vcp-fs__title-brand">{t("brand")}</span>
            <span className="vcp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vcp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vcp-fs__stage" aria-hidden>
          <div className="vcp-fs__scene">
            <div className="vcp-fs__sizes">
              <span className="vcp-fs__size vcp-fs__size--from">{t("sizeFrom")}</span>
              <span className="vcp-fs__size vcp-fs__size--mid">{t("sizeMid")}</span>
              <span className="vcp-fs__size vcp-fs__size--to">{t("sizeTo")}</span>
            </div>

            <div className="vcp-fs__workspace animation-workspace">
              <div className="vcp-fs__ring-wrap">
                <svg className="vcp-fs__ring" viewBox="0 0 120 120" aria-hidden>
                  <circle className="vcp-fs__ring-track" cx="60" cy="60" r="52" />
                  <circle className="vcp-fs__ring-prog" cx="60" cy="60" r="52" />
                </svg>

                <div className="vcp-fs__card">
                  <div className="vcp-fs__preview">
                    <span className="vcp-fs__preview-sky" />
                    <span className="vcp-fs__preview-hill" />
                    <span className="vcp-fs__preview-play" />
                  </div>
                  <div className="vcp-fs__card-meta">
                    <span className="vcp-fs__fname">{t("fileName")}</span>
                    <span className="vcp-fs__drive" title={t("storage")}>
                      <span className="vcp-fs__drive-body" />
                      <span className="vcp-fs__drive-fill" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="vcp-fs__savings">{t("savings")}</div>
            </div>
          </div>
        </div>

        <div className="vcp-fs__footer">
          <button type="button" className="vcp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vcp-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
