"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./grayscale-pdf-landing.css";


type GrayscalePdfIntroGateProps = {
  /** When false, children render immediately (non–grayscale-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Grayscale PDF Converter Online.
 * Color PDF page sweeps into crisp grayscale with ink-saving badge + success check.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function GrayscalePdfIntroGate({ active = true, children }: GrayscalePdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-grayscale-pdf-intro",
  });
  const t = useTranslations("GrayscalePdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="gsp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gsp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="gsp-fs__header">
          <h1 id="gsp-fs-title" className="gsp-fs__title">
            <span className="gsp-fs__title-brand">{t("brand")}</span>
            <span className="gsp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="gsp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="gsp-fs__stage" aria-hidden>
          <div className="gsp-fs__scene">
            <div className="gsp-fs__workspace animation-workspace">
              <div className="gsp-fs__card">
                <div className="gsp-fs__badges">
                  <span className="gsp-fs__badge gsp-fs__badge--color">{t("badgeColor")}</span>
                  <span className="gsp-fs__badge gsp-fs__badge--gray">{t("badgeGray")}</span>
                </div>

                <div className="gsp-fs__preview">
                  <div className="gsp-fs__page gsp-fs__page--color">
                    <span className="gsp-fs__page-title" />
                    <span className="gsp-fs__page-line" />
                    <span className="gsp-fs__page-line gsp-fs__page-line--short" />
                    <div className="gsp-fs__chart" aria-hidden>
                      <span className="gsp-fs__bar gsp-fs__bar--a" />
                      <span className="gsp-fs__bar gsp-fs__bar--b" />
                      <span className="gsp-fs__bar gsp-fs__bar--c" />
                      <span className="gsp-fs__bar gsp-fs__bar--d" />
                      <span className="gsp-fs__bar gsp-fs__bar--e" />
                    </div>
                    <div className="gsp-fs__swatches">
                      <span className="gsp-fs__swatch gsp-fs__swatch--coral" />
                      <span className="gsp-fs__swatch gsp-fs__swatch--sky" />
                      <span className="gsp-fs__swatch gsp-fs__swatch--amber" />
                      <span className="gsp-fs__swatch gsp-fs__swatch--lime" />
                    </div>
                  </div>

                  <div className="gsp-fs__page gsp-fs__page--gray">
                    <span className="gsp-fs__page-title" />
                    <span className="gsp-fs__page-line" />
                    <span className="gsp-fs__page-line gsp-fs__page-line--short" />
                    <div className="gsp-fs__chart" aria-hidden>
                      <span className="gsp-fs__bar gsp-fs__bar--a" />
                      <span className="gsp-fs__bar gsp-fs__bar--b" />
                      <span className="gsp-fs__bar gsp-fs__bar--c" />
                      <span className="gsp-fs__bar gsp-fs__bar--d" />
                      <span className="gsp-fs__bar gsp-fs__bar--e" />
                    </div>
                    <div className="gsp-fs__swatches">
                      <span className="gsp-fs__swatch" />
                      <span className="gsp-fs__swatch" />
                      <span className="gsp-fs__swatch" />
                      <span className="gsp-fs__swatch" />
                    </div>
                  </div>

                  <span className="gsp-fs__wipe" />
                  <span className="gsp-fs__ink">{t("inkBadge")}</span>
                </div>

                <span className="gsp-fs__ok">
                  <span className="gsp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="gsp-fs__footer">
          <button type="button" className="gsp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="gsp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
