"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./mp3-trimmer-landing.css";


type Mp3TrimmerIntroGateProps = {
  /** When false, children render immediately (non–mp3-trimmer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 Trimmer.
 * Waveform + start/end handles → laser scrub over clip → MP3 Trimmed & Saved.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function Mp3TrimmerIntroGate({
  active = true,
  children,
}: Mp3TrimmerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-mp3-trimmer-intro",
  });
  const t = useTranslations("Mp3TrimmerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="m3t-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m3t-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="m3t-fs__header">
          <h1 id="m3t-fs-title" className="m3t-fs__title">
            <span className="m3t-fs__title-brand">{t("brand")}</span>
            <span className="m3t-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="m3t-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="m3t-fs__stage" aria-hidden>
          <div className="m3t-fs__scene">
            <div className="m3t-fs__workspace animation-workspace">
              <div className="m3t-fs__card">
                <div className="m3t-fs__timeline-meta">
                  <span className="m3t-fs__meta-label">{t("clipLabel")}</span>
                  <span className="m3t-fs__meta-range">
                    {t("startTime")} → {t("endTime")}
                  </span>
                </div>

                <div className="m3t-fs__wave-wrap">
                  <div className="m3t-fs__dim m3t-fs__dim--left" />
                  <div className="m3t-fs__dim m3t-fs__dim--right" />
                  <div className="m3t-fs__selection" />

                  <div className="m3t-fs__spectrum">
                    {Array.from({ length: 36 }, (_, i) => (
                      <span
                        key={i}
                        className="m3t-fs__bar"
                        style={{ animationDelay: `${(i % 12) * 0.05}s` }}
                      />
                    ))}
                  </div>

                  <div className="m3t-fs__handle m3t-fs__handle--start">
                    <span className="m3t-fs__handle-line" />
                    <span className="m3t-fs__handle-label">{t("startTime")}</span>
                  </div>
                  <div className="m3t-fs__handle m3t-fs__handle--end">
                    <span className="m3t-fs__handle-line" />
                    <span className="m3t-fs__handle-label">{t("endTime")}</span>
                  </div>

                  <div className="m3t-fs__scrubber" />
                </div>

                <div className="m3t-fs__pills">
                  <span className="m3t-fs__pill m3t-fs__pill--in">{t("pillIn")}</span>
                  <span className="m3t-fs__pill m3t-fs__pill--out">{t("pillOut")}</span>
                  <span className="m3t-fs__pill m3t-fs__pill--dur">{t("pillDur")}</span>
                </div>
              </div>

              <span className="m3t-fs__ok">
                <span className="m3t-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="m3t-fs__footer">
          <button type="button" className="m3t-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="m3t-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
