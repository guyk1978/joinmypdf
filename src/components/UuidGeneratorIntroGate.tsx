"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./uuid-generator-landing.css";


type UuidGeneratorIntroGateProps = {
  /** When false, children render immediately (non–uuid-generator tools). */
  active?: boolean;
  children: ReactNode;
};

const SAMPLE_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const SAMPLE_UUID_V7 = "018f3a2c-9b1e-7c4d-a812-6f0e9d3b7a21";

/**
 * One-way cinematic fullscreen splash for UUID Generator.
 * Entropy pool → crypto hash/format engine → structured UUID v4/v7 strings → success.
 * Shows before the generator workspace (embed modal and dedicated tool page).
 */
export function UuidGeneratorIntroGate({
  active = true,
  children,
}: UuidGeneratorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-uuid-generator-intro",
  });
  const t = useTranslations("UuidGeneratorLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="uuid-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="uuid-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="uuid-fs__header">
          <h1 id="uuid-fs-title" className="uuid-fs__title">
            <span className="uuid-fs__title-brand">{t("brand")}</span>
            <span className="uuid-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="uuid-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="uuid-fs__stage" aria-hidden>
          <div className="uuid-fs__scene">
            <div className="uuid-fs__workspace animation-workspace">
              <div className="uuid-fs__card">
                <div className="uuid-fs__pipeline">
                  <div className="uuid-fs__pane uuid-fs__pane--entropy">
                    <span className="uuid-fs__tag">{t("entropyTag")}</span>
                    <div className="uuid-fs__terminal">
                      <span className="uuid-fs__term-line uuid-fs__term-line--1">
                        a7f3 9c2e 1b84 d0e5
                      </span>
                      <span className="uuid-fs__term-line uuid-fs__term-line--2">
                        58cc 4372 e02b c3d4
                      </span>
                      <span className="uuid-fs__term-line uuid-fs__term-line--3">
                        0e02 b2c3 f47a c10b
                      </span>
                      <span className="uuid-fs__term-line uuid-fs__term-line--4">
                        6f0e 9d3b 018f 3a2c
                      </span>
                      <span className="uuid-fs__cursor" />
                      <span className="uuid-fs__laser" />
                    </div>
                  </div>

                  <div className="uuid-fs__engine">
                    <span className="uuid-fs__flow" />
                    <span className="uuid-fs__core" />
                    <span className="uuid-fs__badge">{t("formatBadge")}</span>
                  </div>

                  <div className="uuid-fs__pane uuid-fs__pane--out">
                    <span className="uuid-fs__tag uuid-fs__tag--out">{t("uuidTag")}</span>
                    <div className="uuid-fs__results">
                      <div className="uuid-fs__result uuid-fs__result--v4">
                        <span className="uuid-fs__ver">{t("v4Label")}</span>
                        <code className="uuid-fs__scramble" data-final={SAMPLE_UUID}>
                          <span className="uuid-fs__hex uuid-fs__hex--spin">8f3a2c9b1e7c4da8</span>
                          <span className="uuid-fs__uuid">{SAMPLE_UUID}</span>
                        </code>
                      </div>
                      <div className="uuid-fs__result uuid-fs__result--v7">
                        <span className="uuid-fs__ver">{t("v7Label")}</span>
                        <code className="uuid-fs__scramble" data-final={SAMPLE_UUID_V7}>
                          <span className="uuid-fs__hex uuid-fs__hex--spin">a8126f0e9d3b7a21</span>
                          <span className="uuid-fs__uuid">{SAMPLE_UUID_V7}</span>
                        </code>
                      </div>
                      <span className="uuid-fs__unique">{t("uniqueBadge")}</span>
                    </div>
                  </div>
                </div>

                <span className="uuid-fs__particle uuid-fs__particle--1" />
                <span className="uuid-fs__particle uuid-fs__particle--2" />
                <span className="uuid-fs__particle uuid-fs__particle--3" />

                <span className="uuid-fs__ok">
                  <span className="uuid-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="uuid-fs__footer">
          <button type="button" className="uuid-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="uuid-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
