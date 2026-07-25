"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./image-combiner-landing.css";


type ImageCombinerIntroGateProps = {
  /** When false, children render immediately (non–image-combiner tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Combiner.
 * Four loose thumbnails → cyan magnetic snap → 2×2 PNG composite + Combined badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function ImageCombinerIntroGate({
  active = true,
  children,
}: ImageCombinerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-image-combiner-intro",
  });
  const t = useTranslations("ImageCombinerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="icb-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="icb-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="icb-fs__header">
          <h1 id="icb-fs-title" className="icb-fs__title">
            <span className="icb-fs__title-brand">{t("brand")}</span>
            <span className="icb-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="icb-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="icb-fs__stage" aria-hidden>
          <div className="icb-fs__scene">
            <div
              className="icb-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="icb-fs__card">
                <div className="icb-fs__stage-art">
                  <div className="icb-fs__board">
                    <span className="icb-fs__magnet" />
                    <span className="icb-fs__trail" />

                    <div className="icb-fs__thumbs">
                      <article className="icb-fs__thumb icb-fs__thumb--1">
                        <span className="icb-fs__art icb-fs__art--landscape" />
                      </article>
                      <article className="icb-fs__thumb icb-fs__thumb--2">
                        <span className="icb-fs__art icb-fs__art--portrait" />
                      </article>
                      <article className="icb-fs__thumb icb-fs__thumb--3">
                        <span className="icb-fs__art icb-fs__art--texture" />
                      </article>
                      <article className="icb-fs__thumb icb-fs__thumb--4">
                        <span className="icb-fs__art icb-fs__art--product" />
                      </article>
                    </div>

                    <span className="icb-fs__png">{t("pngBadge")}</span>

                    <div className="icb-fs__particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>

                <span className="icb-fs__ok">
                  <span className="icb-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="icb-fs__footer">
          <button type="button" className="icb-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="icb-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
