"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./video-resizer-landing.css";


type VideoResizerIntroGateProps = {
  /** When false, children render immediately (non–video-resizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Resizer.
 * A video frame morphs between 16:9, 1:1, and 9:16 with crop handles.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function VideoResizerIntroGate({
  active = true,
  children,
}: VideoResizerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-video-resizer-intro",
  });
  const t = useTranslations("VideoResizerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="vrs-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vrs-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="vrs-fs__header">
          <h1 id="vrs-fs-title" className="vrs-fs__title">
            <span className="vrs-fs__title-brand">{t("brand")}</span>
            <span className="vrs-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vrs-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vrs-fs__stage" aria-hidden>
          <div className="vrs-fs__scene">
            <div
              className="vrs-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="vrs-fs__card">
                <div className="vrs-fs__badges">
                  <span className="vrs-fs__badge vrs-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="vrs-fs__arrow" />
                  <span className="vrs-fs__badge vrs-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="vrs-fs__stage-art">
                  <div className="vrs-fs__ratio-row">
                    <span className="vrs-fs__ratio vrs-fs__ratio--169">{t("ratio169")}</span>
                    <span className="vrs-fs__ratio vrs-fs__ratio--11">{t("ratio11")}</span>
                    <span className="vrs-fs__ratio vrs-fs__ratio--916">{t("ratio916")}</span>
                  </div>

                  <div className="vrs-fs__frame-wrap">
                    <div className="vrs-fs__frame">
                      <span className="vrs-fs__screen">
                        <span className="vrs-fs__play" />
                        <span className="vrs-fs__bar" />
                        <span className="vrs-fs__bar vrs-fs__bar--short" />
                      </span>
                      <span className="vrs-fs__handle vrs-fs__handle--tl" />
                      <span className="vrs-fs__handle vrs-fs__handle--tr" />
                      <span className="vrs-fs__handle vrs-fs__handle--bl" />
                      <span className="vrs-fs__handle vrs-fs__handle--br" />
                    </div>
                  </div>
                </div>

                <span className="vrs-fs__ok">
                  <span className="vrs-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="vrs-fs__footer">
          <button type="button" className="vrs-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="vrs-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
