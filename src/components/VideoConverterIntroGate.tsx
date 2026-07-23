"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoConverterIntroGateProps = {
  /** When false, children render immediately (non–video-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Converter.
 * Source format badge morphs through MP4 / WebM / MOV with processing ring + format chips.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoConverterIntroGate({
  active = true,
  children,
}: VideoConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoConverterLanding");
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

    document.documentElement.setAttribute("data-video-convert-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-convert-intro");
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
        className="vcv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vcv-fs-title"
      >
        <header className="vcv-fs__header">
          <h1 id="vcv-fs-title" className="vcv-fs__title">
            <span className="vcv-fs__title-brand">{t("brand")}</span>
            <span className="vcv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vcv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vcv-fs__stage" aria-hidden>
          <div className="vcv-fs__scene">
            <div className="vcv-fs__chips">
              <span className="vcv-fs__chip vcv-fs__chip--mp4">{t("fmtMp4")}</span>
              <span className="vcv-fs__chip vcv-fs__chip--webm">{t("fmtWebm")}</span>
              <span className="vcv-fs__chip vcv-fs__chip--mov">{t("fmtMov")}</span>
            </div>

            <div className="vcv-fs__workspace animation-workspace">
              <div className="vcv-fs__ring-wrap">
                <span className="vcv-fs__particles">
                  <i /><i /><i /><i /><i /><i />
                </span>
                <svg className="vcv-fs__ring" viewBox="0 0 120 120" aria-hidden>
                  <circle className="vcv-fs__ring-track" cx="60" cy="60" r="52" />
                  <circle className="vcv-fs__ring-prog" cx="60" cy="60" r="52" />
                </svg>

                <div className="vcv-fs__card">
                  <div className="vcv-fs__preview">
                    <span className="vcv-fs__preview-sky" />
                    <span className="vcv-fs__preview-hill" />
                    <span className="vcv-fs__preview-play" />
                  </div>
                  <div className="vcv-fs__card-meta">
                    <span className="vcv-fs__fname">{t("fileName")}</span>
                    <div className="vcv-fs__badge">
                      <span className="vcv-fs__fmt vcv-fs__fmt--src">{t("fmtSrc")}</span>
                      <span className="vcv-fs__fmt vcv-fs__fmt--mp4">{t("fmtMp4")}</span>
                      <span className="vcv-fs__fmt vcv-fs__fmt--webm">{t("fmtWebm")}</span>
                      <span className="vcv-fs__fmt vcv-fs__fmt--mov">{t("fmtMov")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vcv-fs__footer">
          <button type="button" className="vcv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vcv-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
