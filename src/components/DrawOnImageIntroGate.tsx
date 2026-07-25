"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./draw-on-image-landing.css";


type DrawOnImageIntroGateProps = {
  /** When false, children render immediately (non–paint-on-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Draw on Image (paint-on-image).
 * Live pen draws a red arrow, yellow circle, then scripts “Done!” with palette cues.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function DrawOnImageIntroGate({
  active = true,
  children,
}: DrawOnImageIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-draw-intro",
  });
  const t = useTranslations("DrawOnImageLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="drw-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drw-fs-title"
      >
        <header className="drw-fs__header">
          <h1 id="drw-fs-title" className="drw-fs__title">
            <span className="drw-fs__title-brand">{t("brand")}</span>
            <span className="drw-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="drw-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="drw-fs__stage" aria-hidden>
          <div className="drw-fs__scene">
            <div className="drw-fs__toolbar">
              <div className="drw-fs__palette" title={t("palette")}>
                <span className="drw-fs__swatch drw-fs__swatch--red" />
                <span className="drw-fs__swatch drw-fs__swatch--yellow" />
                <span className="drw-fs__swatch drw-fs__swatch--ink" />
              </div>
              <div className="drw-fs__brush" title={t("brush")}>
                <span className="drw-fs__brush-icon" />
                <span className="drw-fs__brush-size" />
              </div>
            </div>

            <div className="drw-fs__workspace animation-workspace">
              <div className="drw-fs__card">
                <div className="drw-fs__photo">
                  <span className="drw-fs__photo-sky" />
                  <span className="drw-fs__photo-hill" />
                  <span className="drw-fs__photo-sun" />
                  <span className="drw-fs__photo-tree" />
                  <span className="drw-fs__photo-rock" />
                </div>

                <svg
                  className="drw-fs__ink"
                  viewBox="0 0 320 240"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Red arrow → sun (top-right) */}
                  <path
                    className="drw-fs__stroke drw-fs__stroke--arrow"
                    d="M 88 148 L 196 78"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    className="drw-fs__stroke drw-fs__stroke--arrowhead"
                    d="M 172 68 L 196 78 L 178 98"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Yellow circle around tree (left) */}
                  <ellipse
                    className="drw-fs__stroke drw-fs__stroke--circle"
                    cx="78"
                    cy="148"
                    rx="42"
                    ry="48"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  {/* Script “Done!” */}
                  <text
                    className="drw-fs__done"
                    x="168"
                    y="198"
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {t("done")}
                  </text>
                </svg>

                <div className="drw-fs__pen">
                  <span className="drw-fs__pen-tip" />
                  <span className="drw-fs__pen-body" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="drw-fs__footer">
          <button type="button" className="drw-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="drw-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
