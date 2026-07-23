"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./ssl-decoder-landing.css";

type IntroPhase = "intro" | "workspace";

type SslDecoderIntroGateProps = {
  /** When false, children render immediately (non–ssl-decoder tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for SSL Certificate Decoder.
 * Lock/chain emblem + PEM unfolds into CN / Expiry / Issuer + TLS badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function SslDecoderIntroGate({ active = true, children }: SslDecoderIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("SslDecoderLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-ssl-decoder-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-ssl-decoder-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

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
                <div className="ssl-fs__badges">
                  <span className="ssl-fs__badge ssl-fs__badge--raw">{t("badgeRaw")}</span>
                  <span className="ssl-fs__badge ssl-fs__badge--tls">{t("badgeTls")}</span>
                </div>

                <div className="ssl-fs__preview">
                  <div className="ssl-fs__emblem">
                    <span className="ssl-fs__chain" />
                    <span className="ssl-fs__lock">
                      <span className="ssl-fs__shackle" />
                      <span className="ssl-fs__body" />
                    </span>
                  </div>

                  <div className="ssl-fs__decode">
                    <div className="ssl-fs__pem">
                      <span className="ssl-fs__pem-line">{t("pemBegin")}</span>
                      <span className="ssl-fs__pem-line ssl-fs__pem-line--blob">MIIDdzCCAl+gAwIBAgIEb…</span>
                      <span className="ssl-fs__pem-line">{t("pemEnd")}</span>
                    </div>

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
                    </div>
                  </div>
                </div>
              </div>

              <span className="ssl-fs__ok">
                <span className="ssl-fs__check" />
                {t("success")}
              </span>
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
