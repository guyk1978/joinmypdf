"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./audio-trimmer-landing.css";

type AudioTrimmerIntroGateProps = {
  /** When false, children render immediately (non–audio-trimmer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Audio Trimmer.
 * Waveform + start/end handles → scrub over clip → soft fade edges → Trimmed & Saved.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function AudioTrimmerIntroGate({
  active = true,
  children,
}: AudioTrimmerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-audio-trimmer-intro",
  });
  const t = useTranslations("AudioTrimmerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="atr-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atr-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="atr-fs__header">
          <h1 id="atr-fs-title" className="atr-fs__title">
            <span className="atr-fs__title-brand">{t("brand")}</span>
            <span className="atr-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="atr-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="atr-fs__stage" aria-hidden>
          <div className="atr-fs__scene">
            <div className="atr-fs__workspace animation-workspace">
              <div className="atr-fs__card">
                <div className="atr-fs__timeline-meta">
                  <span className="atr-fs__meta-label">{t("clipLabel")}</span>
                  <span className="atr-fs__meta-range">
                    {t("startTime")} → {t("endTime")}
                  </span>
                </div>

                <div className="atr-fs__wave-wrap">
                  <div className="atr-fs__dim atr-fs__dim--left" />
                  <div className="atr-fs__dim atr-fs__dim--right" />
                  <div className="atr-fs__selection" />
                  <div className="atr-fs__fade atr-fs__fade--in" />
                  <div className="atr-fs__fade atr-fs__fade--out" />

                  <div className="atr-fs__spectrum">
                    {Array.from({ length: 36 }, (_, i) => (
                      <span
                        key={i}
                        className="atr-fs__bar"
                        style={{ animationDelay: `${(i % 12) * 0.05}s` }}
                      />
                    ))}
                  </div>

                  <div className="atr-fs__handle atr-fs__handle--start">
                    <span className="atr-fs__handle-line" />
                    <span className="atr-fs__handle-label">{t("startTime")}</span>
                  </div>
                  <div className="atr-fs__handle atr-fs__handle--end">
                    <span className="atr-fs__handle-line" />
                    <span className="atr-fs__handle-label">{t("endTime")}</span>
                  </div>

                  <div className="atr-fs__scrubber" />
                </div>

                <div className="atr-fs__pills">
                  <span className="atr-fs__pill atr-fs__pill--in">{t("pillIn")}</span>
                  <span className="atr-fs__pill atr-fs__pill--out">{t("pillOut")}</span>
                  <span className="atr-fs__pill atr-fs__pill--fade">{t("pillFade")}</span>
                  <span className="atr-fs__pill atr-fs__pill--dur">{t("pillDur")}</span>
                </div>
              </div>

              <span className="atr-fs__ok">
                <span className="atr-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="atr-fs__footer">
          <button type="button" className="atr-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="atr-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
