"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./string-generator-landing.css";


type StringGeneratorIntroGateProps = {
  /** When false, children render immediately (non–string-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for String Generator.
 * Param toggles → entropy node + slot scramble → random strings / UUID output.
 * Shows before the generator workspace (embed modal and dedicated tool page).
 */
export function StringGeneratorIntroGate({
  active = true,
  children,
}: StringGeneratorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-string-generator-intro",
  });
  const t = useTranslations("StringGeneratorLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="sg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sg-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="sg-fs__header">
          <h1 id="sg-fs-title" className="sg-fs__title">
            <span className="sg-fs__title-brand">{t("brand")}</span>
            <span className="sg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="sg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="sg-fs__stage" aria-hidden>
          <div className="sg-fs__scene">
            <div className="sg-fs__workspace animation-workspace">
              <div className="sg-fs__card">
                <div className="sg-fs__pipeline">
                  <div className="sg-fs__params">
                    <span className="sg-fs__tag">{t("paramsTag")}</span>
                    <div className="sg-fs__length">
                      <span className="sg-fs__length-label">{t("lengthLabel")}</span>
                      <span className="sg-fs__length-track">
                        <span className="sg-fs__length-fill" />
                        <span className="sg-fs__length-thumb" />
                      </span>
                      <span className="sg-fs__length-value">32</span>
                    </div>
                    <div className="sg-fs__toggles">
                      <span className="sg-fs__toggle sg-fs__toggle--on">{t("toggleUpper")}</span>
                      <span className="sg-fs__toggle sg-fs__toggle--on">{t("toggleNumbers")}</span>
                      <span className="sg-fs__toggle sg-fs__toggle--on">{t("toggleSymbols")}</span>
                    </div>
                    <span className="sg-fs__entropy">{t("entropyBadge")}</span>
                  </div>

                  <div className="sg-fs__engine">
                    <span className="sg-fs__flow" />
                    <span className="sg-fs__core" />
                    <span className="sg-fs__sparks">
                      <span className="sg-fs__spark sg-fs__spark--1" />
                      <span className="sg-fs__spark sg-fs__spark--2" />
                      <span className="sg-fs__spark sg-fs__spark--3" />
                    </span>
                  </div>

                  <div className="sg-fs__output">
                    <span className="sg-fs__tag sg-fs__tag--out">{t("outputTag")}</span>
                    <div className="sg-fs__slots" aria-hidden>
                      {Array.from({ length: 8 }, (_, i) => (
                        <span key={i} className={`sg-fs__slot sg-fs__slot--${i + 1}`}>
                          <span className="sg-fs__reel">A7Kx9#mQp2</span>
                        </span>
                      ))}
                    </div>
                    <div className="sg-fs__results">
                      <code className="sg-fs__result sg-fs__result--string">{t("sampleString")}</code>
                      <code className="sg-fs__result sg-fs__result--uuid">{t("sampleUuid")}</code>
                    </div>
                  </div>
                </div>

                <span className="sg-fs__particle sg-fs__particle--1" />
                <span className="sg-fs__particle sg-fs__particle--2" />
                <span className="sg-fs__particle sg-fs__particle--3" />
              </div>

              <span className="sg-fs__ok">
                <span className="sg-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="sg-fs__footer">
          <button type="button" className="sg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="sg-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
