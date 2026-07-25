"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./url-encoder-decoder-landing.css";


type UrlEncoderDecoderIntroGateProps = {
  /** When false, children render immediately (non–url-encoder-decoder tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for URL Encoder / Decoder.
 * Plain text morphs into percent-encoded form with UTF-8 Safe badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function UrlEncoderDecoderIntroGate({
  active = true,
  children,
}: UrlEncoderDecoderIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-url-encoder-decoder-intro",
  });
  const t = useTranslations("UrlEncoderDecoderLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ued-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ued-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ued-fs__header">
          <h1 id="ued-fs-title" className="ued-fs__title">
            <span className="ued-fs__title-brand">{t("brand")}</span>
            <span className="ued-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ued-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ued-fs__stage" aria-hidden>
          <div className="ued-fs__scene">
            <div className="ued-fs__workspace animation-workspace">
              <div className="ued-fs__card">
                <div className="ued-fs__modes">
                  <span className="ued-fs__mode ued-fs__mode--plain">{t("modePlain")}</span>
                  <span className="ued-fs__arrow" />
                  <span className="ued-fs__mode ued-fs__mode--encoded">{t("modeEncoded")}</span>
                  <span className="ued-fs__safe">{t("utf8Safe")}</span>
                </div>

                <div className="ued-fs__terminal">
                  <div className="ued-fs__chrome">
                    <span className="ued-fs__dot" />
                    <span className="ued-fs__dot" />
                    <span className="ued-fs__dot" />
                    <span className="ued-fs__prompt">{t("prompt")}</span>
                  </div>

                  <div className="ued-fs__lines">
                    <div className="ued-fs__line ued-fs__line--in">
                      <span className="ued-fs__label">{t("labelIn")}</span>
                      <span className="ued-fs__value">
                        <span className="ued-fs__plain">{t("plainText")}</span>
                      </span>
                    </div>
                    <div className="ued-fs__line ued-fs__line--out">
                      <span className="ued-fs__label">{t("labelOut")}</span>
                      <span className="ued-fs__value">
                        <span className="ued-fs__encoded">{t("encodedText")}</span>
                      </span>
                    </div>
                  </div>

                  <span className="ued-fs__spark" />
                </div>
              </div>

              <span className="ued-fs__ok">
                <span className="ued-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ued-fs__footer">
          <button type="button" className="ued-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ued-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
