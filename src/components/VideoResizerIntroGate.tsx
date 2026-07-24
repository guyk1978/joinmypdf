"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./video-resizer-landing.css";

type IntroPhase = "intro" | "workspace";

type VideoResizerIntroGateProps = {
  /** When false, children render immediately (non–video-resizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Video Resizer.
 * A video frame morphs between 16:9, 1:1, and 9:16 with crop handles.
 * Only runs inside the ToolModal CALC embed.
 */
export function VideoResizerIntroGate({
  active = true,
  children,
}: VideoResizerIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("VideoResizerLanding");
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

    document.documentElement.setAttribute("data-video-resizer-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-video-resizer-intro");
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
