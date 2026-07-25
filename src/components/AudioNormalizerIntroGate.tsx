"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./audio-normalizer-landing.css";


type AudioNormalizerIntroGateProps = {
  /** When false, children render immediately (non–audio-normalizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Audio Normalizer.
 * Uneven peaks → calibration sweep → uniform studio envelope + dB lock.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function AudioNormalizerIntroGate({
  active = true,
  children,
}: AudioNormalizerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-audio-normalizer-intro",
  });
  const t = useTranslations("AudioNormalizerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="anrm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="anrm-fs-title"
      >
        <header className="anrm-fs__header">
          <h1 id="anrm-fs-title" className="anrm-fs__title">
            <span className="anrm-fs__title-brand">{t("brand")}</span>
            <span className="anrm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="anrm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="anrm-fs__stage" aria-hidden>
          <div className="anrm-fs__scene">
            <div className="anrm-fs__workspace animation-workspace">
              <div className="anrm-fs__panel">
                <div className="anrm-fs__meter">
                  <span className="anrm-fs__db anrm-fs__db--from">{t("dbFrom")}</span>
                  <span className="anrm-fs__db anrm-fs__db--to">{t("dbTo")}</span>
                  <span className="anrm-fs__target">{t("target")}</span>
                </div>

                <div className="anrm-fs__tracks">
                  <div className="anrm-fs__track anrm-fs__track--quiet">
                    <span className="anrm-fs__label">{t("quietLabel")}</span>
                    <div className="anrm-fs__bars anrm-fs__bars--quiet">
                      <span /><span /><span /><span /><span /><span /><span /><span />
                      <span /><span /><span /><span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <div className="anrm-fs__track anrm-fs__track--loud">
                    <span className="anrm-fs__label">{t("loudLabel")}</span>
                    <div className="anrm-fs__bars anrm-fs__bars--loud">
                      <span /><span /><span /><span /><span /><span /><span /><span />
                      <span /><span /><span /><span /><span /><span /><span /><span />
                    </div>
                  </div>
                </div>

                <div className="anrm-fs__sweep" />
                <div className="anrm-fs__guide" />
              </div>

              <span className="anrm-fs__ok">
                <span className="anrm-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="anrm-fs__footer">
          <button type="button" className="anrm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="anrm-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
