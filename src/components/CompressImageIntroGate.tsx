"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./compress-image-landing.css";


type CompressImageIntroGateProps = {
  /** When false, children render immediately (non–compress-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Compress Images.
 * Landscape preview → quality loupe scan → size badge shrinks with savings.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function CompressImageIntroGate({
  active = true,
  children,
}: CompressImageIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-compress-image-intro",
  });
  const t = useTranslations("CompressImageLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="cimg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cimg-fs-title"
      >
        <header className="cimg-fs__header">
          <h1 id="cimg-fs-title" className="cimg-fs__title">
            <span className="cimg-fs__title-brand">{t("brand")}</span>
            <span className="cimg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cimg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cimg-fs__stage" aria-hidden>
          <div className="cimg-fs__scene">
            <div className="cimg-fs__workspace animation-workspace">
              <div className="cimg-fs__particles">
                <span /><span /><span /><span /><span /><span /><span /><span />
              </div>

              <div className="cimg-fs__card">
                <div className="cimg-fs__photo">
                  <div className="cimg-fs__sky" />
                  <div className="cimg-fs__mountains" />
                  <div className="cimg-fs__water" />
                  <div className="cimg-fs__detail" />
                  <div className="cimg-fs__loupe">
                    <span className="cimg-fs__loupe-glass" />
                    <span className="cimg-fs__loupe-ring" />
                  </div>
                  <div className="cimg-fs__shield" />
                </div>

                <div className="cimg-fs__meta">
                  <div className="cimg-fs__size">
                    <span className="cimg-fs__size-val cimg-fs__size-val--a">{t("sizeFrom")}</span>
                    <span className="cimg-fs__size-val cimg-fs__size-val--b">{t("sizeMid")}</span>
                    <span className="cimg-fs__size-val cimg-fs__size-val--c">{t("sizeTo")}</span>
                  </div>
                  <span className="cimg-fs__savings">{t("savings")}</span>
                </div>
                <span className="cimg-fs__quality">{t("quality")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cimg-fs__footer">
          <button type="button" className="cimg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="cimg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
