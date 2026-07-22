"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./video-metadata-cleaner-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoMetadataCleanerIntroGateProps = {
  /** When false, children render immediately (non–video-metadata-cleaner tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Metadata Cleaner.
 * File card + metadata panel; security scan dissolves GPS/device tags into checkmarks.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoMetadataCleanerIntroGate({
  active = true,
  children,
}: VideoMetadataCleanerIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoMetadataCleanerLanding");
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

    document.documentElement.setAttribute("data-video-meta-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-meta-intro");
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
        className="vmc-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vmc-fs-title"
      >
        <header className="vmc-fs__header">
          <h1 id="vmc-fs-title" className="vmc-fs__title">
            <span className="vmc-fs__title-brand">{t("brand")}</span>
            <span className="vmc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vmc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vmc-fs__stage" aria-hidden>
          <div className="vmc-fs__scene">
            <div className="vmc-fs__workspace">
              <div className="vmc-fs__file">
                <div className="vmc-fs__file-preview">
                  <span className="vmc-fs__file-sky" />
                  <span className="vmc-fs__file-hill" />
                  <span className="vmc-fs__file-play" />
                </div>
                <div className="vmc-fs__file-meta">
                  <span className="vmc-fs__file-name">{t("fileName")}</span>
                  <span className="vmc-fs__file-size">{t("fileSize")}</span>
                </div>
              </div>

              <div className="vmc-fs__panel">
                <div className="vmc-fs__panel-head">
                  <span className="vmc-fs__panel-title">{t("panelTitle")}</span>
                  <span className="vmc-fs__panel-shield" />
                </div>

                <ul className="vmc-fs__tags">
                  <li className="vmc-fs__tag vmc-fs__tag--gps">
                    <span className="vmc-fs__tag-key">{t("gpsKey")}</span>
                    <span className="vmc-fs__tag-val">{t("gpsVal")}</span>
                    <span className="vmc-fs__tag-check" aria-hidden />
                  </li>
                  <li className="vmc-fs__tag vmc-fs__tag--device">
                    <span className="vmc-fs__tag-key">{t("deviceKey")}</span>
                    <span className="vmc-fs__tag-val">{t("deviceVal")}</span>
                    <span className="vmc-fs__tag-check" aria-hidden />
                  </li>
                  <li className="vmc-fs__tag vmc-fs__tag--time">
                    <span className="vmc-fs__tag-key">{t("timeKey")}</span>
                    <span className="vmc-fs__tag-val">{t("timeVal")}</span>
                    <span className="vmc-fs__tag-check" aria-hidden />
                  </li>
                </ul>

                <div className="vmc-fs__scan" />
              </div>

              <div className="vmc-fs__status">
                <span className="vmc-fs__status-dot" />
                <span className="vmc-fs__status-text">{t("status")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vmc-fs__footer">
          <button type="button" className="vmc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="vmc-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
