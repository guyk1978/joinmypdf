"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./favicon-cropper-landing.css";


type FaviconCropperIntroGateProps = {
  /** When false, children render immediately (non–favicon-cropper tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Favicon Cropper.
 * Image card → glowing crop rails slide inward → square lock + size badges.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function FaviconCropperIntroGate({
  active = true,
  children,
}: FaviconCropperIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-favicon-cropper-intro",
  });
  const t = useTranslations("FaviconCropperLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="fcp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fcp-fs-title"
      >
        <header className="fcp-fs__header">
          <h1 id="fcp-fs-title" className="fcp-fs__title">
            <span className="fcp-fs__title-brand">{t("brand")}</span>
            <span className="fcp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="fcp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="fcp-fs__stage" aria-hidden>
          <div className="fcp-fs__scene">
            <div className="fcp-fs__workspace animation-workspace">
              <div className="fcp-fs__card">
                <div className="fcp-fs__art">
                  <span className="fcp-fs__blob fcp-fs__blob--a" />
                  <span className="fcp-fs__blob fcp-fs__blob--b" />
                  <span className="fcp-fs__focal" />
                </div>

                <div className="fcp-fs__shade fcp-fs__shade--t" />
                <div className="fcp-fs__shade fcp-fs__shade--b" />
                <div className="fcp-fs__shade fcp-fs__shade--l" />
                <div className="fcp-fs__shade fcp-fs__shade--r" />

                <div className="fcp-fs__rail fcp-fs__rail--t" />
                <div className="fcp-fs__rail fcp-fs__rail--b" />
                <div className="fcp-fs__rail fcp-fs__rail--l" />
                <div className="fcp-fs__rail fcp-fs__rail--r" />

                <div className="fcp-fs__grid" />

                <span className="fcp-fs__badge fcp-fs__badge--ratio">{t("ratioBadge")}</span>
                <span className="fcp-fs__badge fcp-fs__badge--size">{t("sizeBadge")}</span>
              </div>

              <span className="fcp-fs__ok">
                <span className="fcp-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="fcp-fs__footer">
          <button type="button" className="fcp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="fcp-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
