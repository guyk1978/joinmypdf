"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
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
 * Plain text → cryptographic encoder node + laser byte packets → Base64 string.
 * Shows before the encoder workspace (embed modal and dedicated tool page).
 */
export function Base64EncoderDecoderIntroGate({
  active = true,
  children,
}: Base64EncoderDecoderIntroGateProps) {
  const introActive = active;
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
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
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
                <div className="b64-fs__pipeline">
                  <div className="b64-fs__pane b64-fs__pane--in">
                    <span className="b64-fs__tag">{t("inputLabel")}</span>
                    <p className="b64-fs__plain">{t("plainSample")}</p>
                    <div className="b64-fs__bytes" aria-hidden>
                      <span>48</span>
                      <span>65</span>
                      <span>6C</span>
                      <span>6C</span>
                      <span>6F</span>
                    </div>
                  </div>

                  <div className="b64-fs__bridge">
                    <span className="b64-fs__flow" />
                    <span className="b64-fs__packet b64-fs__packet--1" />
                    <span className="b64-fs__packet b64-fs__packet--2" />
                    <span className="b64-fs__packet b64-fs__packet--3" />
                    <span className="b64-fs__core" />
                    <span className="b64-fs__live">{t("liveLabel")}</span>
                    <span className="b64-fs__latency">{t("latencyBadge")}</span>
                  </div>

                  <div className="b64-fs__pane b64-fs__pane--out">
                    <span className="b64-fs__tag b64-fs__tag--out">{t("outputLabel")}</span>
                    <p className="b64-fs__encoded">
                      <span className="b64-fs__chars">{t("encodedSample")}</span>
                      <span className="b64-fs__caret" />
                    </p>
                    <span className="b64-fs__laser" />
                  </div>
                </div>

                <span className="b64-fs__particle b64-fs__particle--1" />
                <span className="b64-fs__particle b64-fs__particle--2" />
                <span className="b64-fs__particle b64-fs__particle--3" />
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
      return (
        <div
          className="b64-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
