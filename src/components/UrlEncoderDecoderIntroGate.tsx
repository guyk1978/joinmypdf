"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./url-encoder-decoder-landing.css";

type IntroPhase = "intro" | "workspace";

type UrlEncoderDecoderIntroGateProps = {
  /** When false, children render immediately (non–url-encoder-decoder tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for URL Encoder / Decoder.
 * Plain text morphs into percent-encoded form with UTF-8 Safe badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function UrlEncoderDecoderIntroGate({
  active = true,
  children,
}: UrlEncoderDecoderIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("UrlEncoderDecoderLanding");
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

    document.documentElement.setAttribute("data-url-encoder-decoder-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-url-encoder-decoder-intro");
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
