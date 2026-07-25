"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./video-metadata-cleaner-landing.css";


type VideoMetadataCleanerIntroGateProps = {
  /** When false, children render immediately (non–video-metadata-cleaner tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Metadata Cleaner.
 * Video file card → scrubbing engine → GPS/device tags laser-scrubbed to [SCRUBBED] → success.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function VideoMetadataCleanerIntroGate({
  active = true,
  children,
}: VideoMetadataCleanerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-video-meta-intro",
  });
  const t = useTranslations("VideoMetadataCleanerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="vmc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vmc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
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
            <div className="vmc-fs__workspace animation-workspace">
              <div className="vmc-fs__card">
                <div className="vmc-fs__pipeline">
                  <div className="vmc-fs__pane vmc-fs__pane--file">
                    <span className="vmc-fs__tag">{t("fileTag")}</span>
                    <div className="vmc-fs__file">
                      <div className="vmc-fs__preview">
                        <span className="vmc-fs__sky" />
                        <span className="vmc-fs__hill" />
                        <span className="vmc-fs__play" />
                        <span className="vmc-fs__alert" />
                      </div>
                      <div className="vmc-fs__file-meta">
                        <span className="vmc-fs__file-name">{t("fileName")}</span>
                        <span className="vmc-fs__file-size">{t("fileSize")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="vmc-fs__engine">
                    <span className="vmc-fs__flow" />
                    <span className="vmc-fs__core" />
                    <span className="vmc-fs__badge">{t("sandboxBadge")}</span>
                  </div>

                  <div className="vmc-fs__pane vmc-fs__pane--panel">
                    <span className="vmc-fs__tag vmc-fs__tag--panel">{t("panelTitle")}</span>
                    <div className="vmc-fs__panel">
                      <div className="vmc-fs__row vmc-fs__row--gps">
                        <span className="vmc-fs__row-key">{t("gpsKey")}</span>
                        <span className="vmc-fs__row-val">{t("gpsVal")}</span>
                        <span className="vmc-fs__scrubbed">{t("scrubbed")}</span>
                      </div>
                      <div className="vmc-fs__row vmc-fs__row--device">
                        <span className="vmc-fs__row-key">{t("deviceKey")}</span>
                        <span className="vmc-fs__row-val">{t("deviceVal")}</span>
                        <span className="vmc-fs__scrubbed">{t("scrubbed")}</span>
                      </div>
                      <div className="vmc-fs__row vmc-fs__row--time">
                        <span className="vmc-fs__row-key">{t("timeKey")}</span>
                        <span className="vmc-fs__row-val">{t("timeVal")}</span>
                        <span className="vmc-fs__scrubbed">{t("scrubbed")}</span>
                      </div>
                      <span className="vmc-fs__laser" />
                    </div>
                  </div>
                </div>

                <span className="vmc-fs__particle vmc-fs__particle--1" />
                <span className="vmc-fs__particle vmc-fs__particle--2" />
                <span className="vmc-fs__particle vmc-fs__particle--3" />

                <span className="vmc-fs__ok">
                  <span className="vmc-fs__check" />
                  {t("success")}
                </span>
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
      return (
        <div
          className="vmc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
