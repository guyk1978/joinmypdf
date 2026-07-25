"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import "./intro-pdf-mockup.css";
import "./rotate-align-landing.css";


type RotateAlignIntroGateProps = {
  /** When false, children render immediately (non–rotate-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Rotate & Align Suite.
 * Tilted preview rotates to 0° against a horizon guide with a degree badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function RotateAlignIntroGate({
  active = true,
  children,
}: RotateAlignIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-rotate-intro",
  });
  const t = useTranslations("RotateAlignLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="rot-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rot-fs-title"
      >
        <header className="rot-fs__header">
          <h1 id="rot-fs-title" className="rot-fs__title">
            <span className="rot-fs__title-brand">{t("brand")}</span>
            <span className="rot-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rot-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rot-fs__stage" aria-hidden>
          <div className="rot-fs__scene">
            <div className="rot-fs__workspace animation-workspace">
              <div className="rot-fs__grid" />
              <div className="rot-fs__horizon">
                <span className="rot-fs__horizon-line" />
                <span className="rot-fs__horizon-label">{t("horizon")}</span>
              </div>

              <article className="rot-fs__card">
                <IntroPdfMockup title={t("docLabel")} badge={t("docBadge")} />
              </article>

              <div className="rot-fs__badge">
                <span className="rot-fs__deg rot-fs__deg--a">{t("degTilt")}</span>
                <span className="rot-fs__deg rot-fs__deg--b">{t("degLevel")}</span>
                <span className="rot-fs__lock">{t("aligned")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rot-fs__footer">
          <button type="button" className="rot-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="rot-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
