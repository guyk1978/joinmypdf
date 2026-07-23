"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./base64-encoder-decoder-landing.css";

type IntroPhase = "intro" | "workspace";

type Base64EncoderDecoderIntroGateProps = {
  /** When false, children render immediately (non–base64-encoder-decoder tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Base64 Encoder / Decoder.
 * Dual-pane terminal → syntax laser → plain text morphs to Base64 + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function Base64EncoderDecoderIntroGate({
  active = true,
  children,
}: Base64EncoderDecoderIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("Base64EncoderDecoderLanding");
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

    document.documentElement.setAttribute("data-base64-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-base64-intro");
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
        className="b64-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="b64-fs-title"
      >
        <header className="b64-fs__header">
          <h1 id="b64-fs-title" className="b64-fs__title">
            <span className="b64-fs__title-brand">{t("brand")}</span>
            <span className="b64-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="b64-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="b64-fs__stage" aria-hidden>
          <div className="b64-fs__scene">
            <div className="b64-fs__workspace animation-workspace">
              <div className="b64-fs__card">
                <div className="b64-fs__status">
                  <span className="b64-fs__pill b64-fs__pill--enc">{t("encodeLabel")}</span>
                  <span className="b64-fs__pill b64-fs__pill--live">{t("liveLabel")}</span>
                </div>

                <div className="b64-fs__panes">
                  <div className="b64-fs__pane b64-fs__pane--in">
                    <span className="b64-fs__pane-label">{t("inputLabel")}</span>
                    <p className="b64-fs__plain">{t("plainSample")}</p>
                    <div className="b64-fs__laser" />
                  </div>
                  <div className="b64-fs__arrow" />
                  <div className="b64-fs__pane b64-fs__pane--out">
                    <span className="b64-fs__pane-label">{t("outputLabel")}</span>
                    <p className="b64-fs__encoded">
                      <span className="b64-fs__chars">{t("encodedSample")}</span>
                      <span className="b64-fs__caret" />
                    </p>
                  </div>
                </div>
              </div>

              <span className="b64-fs__ok">
                <span className="b64-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="b64-fs__footer">
          <button type="button" className="b64-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="b64-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
