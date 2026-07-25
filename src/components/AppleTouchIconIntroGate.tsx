"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./apple-touch-icon-landing.css";


type AppleTouchIconIntroGateProps = {
  /** When false, children render immediately (non–apple-touch-icon tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Apple Touch Icon Generator.
 * Logo card → iOS mask snap → rounded icon + gloss + 180×180 badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function AppleTouchIconIntroGate({
  active = true,
  children,
}: AppleTouchIconIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-apple-touch-icon-intro",
  });
  const t = useTranslations("AppleTouchIconLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ati-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ati-fs-title"
      >
        <header className="ati-fs__header">
          <h1 id="ati-fs-title" className="ati-fs__title">
            <span className="ati-fs__title-brand">{t("brand")}</span>
            <span className="ati-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ati-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ati-fs__stage" aria-hidden>
          <div className="ati-fs__scene">
            <div className="ati-fs__workspace animation-workspace">
              <div className="ati-fs__frame">
                <div className="ati-fs__guides" />
                <div className="ati-fs__logo">
                  <span className="ati-fs__mark" />
                  <span className="ati-fs__mark-word">{t("logoWord")}</span>
                </div>
                <div className="ati-fs__mask">
                  <div className="ati-fs__gloss" />
                </div>
                <span className="ati-fs__size">{t("sizeBadge")}</span>
              </div>

              <span className="ati-fs__ok">
                <span className="ati-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ati-fs__footer">
          <button type="button" className="ati-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="ati-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
