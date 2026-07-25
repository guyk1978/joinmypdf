"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./ssl-decoder-landing.css";


type SslDecoderIntroGateProps = {
  /** When false, children render immediately (non–ssl-decoder tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for SSL Certificate Decoder.
 * PEM + padlock → crypto inspection engine → CN / Valid Until / Issuer + TLS handshake → success.
 * Shows before the decoder workspace (embed modal and dedicated tool page).
 */
export function SslDecoderIntroGate({
  active = true,
  children,
}: SslDecoderIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-ssl-decoder-intro",
  });
  const t = useTranslations("SslDecoderLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ssl-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ssl-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ssl-fs__header">
          <h1 id="ssl-fs-title" className="ssl-fs__title">
            <span className="ssl-fs__title-brand">{t("brand")}</span>
            <span className="ssl-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ssl-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ssl-fs__stage" aria-hidden>
          <div className="ssl-fs__scene">
            <div className="ssl-fs__workspace animation-workspace">
              <div className="ssl-fs__card">
                <div className="ssl-fs__pipeline">
                  <div className="ssl-fs__pane ssl-fs__pane--pem">
                    <span className="ssl-fs__tag">{t("pemTag")}</span>
                    <div className="ssl-fs__pem-wrap">
                      <div className="ssl-fs__emblem">
                        <span className="ssl-fs__glow" />
                        <span className="ssl-fs__lock">
                          <span className="ssl-fs__shackle" />
                          <span className="ssl-fs__body" />
                        </span>
                      </div>
                      <div className="ssl-fs__pem">
                        <span className="ssl-fs__pem-line ssl-fs__pem-line--begin">
                          {t("pemBegin")}
                        </span>
                        <span className="ssl-fs__pem-line ssl-fs__pem-line--blob">
                          MIIDdzCCAl+gAwIBAgIEb…
                        </span>
                        <span className="ssl-fs__pem-line ssl-fs__pem-line--blob">
                          AoGBANzX1YvQpR8kFqLm…
                        </span>
                        <span className="ssl-fs__pem-line ssl-fs__pem-line--end">
                          {t("pemEnd")}
                        </span>
                        <span className="ssl-fs__laser" />
                      </div>
                    </div>
                  </div>

                  <div className="ssl-fs__engine">
                    <span className="ssl-fs__flow" />
                    <span className="ssl-fs__core" />
                    <span className="ssl-fs__badge">{t("badgeTls")}</span>
                  </div>

                  <div className="ssl-fs__pane ssl-fs__pane--fields">
                    <span className="ssl-fs__tag ssl-fs__tag--fields">{t("decodedTag")}</span>
                    <div className="ssl-fs__fields">
                      <div className="ssl-fs__field ssl-fs__field--cn">
                        <span className="ssl-fs__field-label">{t("cnLabel")}</span>
                        <span className="ssl-fs__field-value">{t("cnValue")}</span>
                      </div>
                      <div className="ssl-fs__field ssl-fs__field--exp">
                        <span className="ssl-fs__field-label">{t("expLabel")}</span>
                        <span className="ssl-fs__field-value">{t("expValue")}</span>
                      </div>
                      <div className="ssl-fs__field ssl-fs__field--iss">
                        <span className="ssl-fs__field-label">{t("issLabel")}</span>
                        <span className="ssl-fs__field-value">{t("issValue")}</span>
                      </div>
                      <span className="ssl-fs__handshake" />
                    </div>
                  </div>
                </div>

                <span className="ssl-fs__particle ssl-fs__particle--1" />
                <span className="ssl-fs__particle ssl-fs__particle--2" />
                <span className="ssl-fs__particle ssl-fs__particle--3" />

                <span className="ssl-fs__ok">
                  <span className="ssl-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ssl-fs__footer">
          <button type="button" className="ssl-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ssl-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
