"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp3-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp3ConverterIntroGateProps = {
  /** When false, children render immediately (non–mp3-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 Converter.
 * Multi-format ingest → EQ spectrum + laser compress → .MP3 320kbps + Converted to MP3.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function Mp3ConverterIntroGate({
  active = true,
  children,
}: Mp3ConverterIntroGateProps) {
  const introActive = active;
  const t = useTranslations("Mp3ConverterLanding");
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

    document.documentElement.setAttribute("data-mp3-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp3-converter-intro");
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
        className="mp3c-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp3c-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="mp3c-fs__header">
          <h1 id="mp3c-fs-title" className="mp3c-fs__title">
            <span className="mp3c-fs__title-brand">{t("brand")}</span>
            <span className="mp3c-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="mp3c-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="mp3c-fs__stage" aria-hidden>
          <div className="mp3c-fs__scene">
            <div className="mp3c-fs__workspace animation-workspace">
              <div className="mp3c-fs__card">
                <div className="mp3c-fs__panels">
                  <div className="mp3c-fs__panel mp3c-fs__panel--src">
                    <span className="mp3c-fs__panel-label">{t("sourceLabel")}</span>
                    <div className="mp3c-fs__src-stack">
                      <span className="mp3c-fs__tag mp3c-fs__tag--wav">{t("wavTag")}</span>
                      <span className="mp3c-fs__tag mp3c-fs__tag--aac">{t("aacTag")}</span>
                      <span className="mp3c-fs__tag mp3c-fs__tag--flac">{t("flacTag")}</span>
                    </div>
                  </div>

                  <div className="mp3c-fs__eq-wrap">
                    <div className="mp3c-fs__eq">
                      {Array.from({ length: 22 }, (_, i) => (
                        <span
                          key={i}
                          className="mp3c-fs__bar"
                          style={{ animationDelay: `${(i % 11) * 0.08}s` }}
                        />
                      ))}
                    </div>
                    <div className="mp3c-fs__laser" />
                    <div className="mp3c-fs__compress" />
                  </div>

                  <div className="mp3c-fs__panel mp3c-fs__panel--out">
                    <span className="mp3c-fs__panel-label">{t("outputLabel")}</span>
                    <span className="mp3c-fs__tag mp3c-fs__tag--mp3">{t("mp3Tag")}</span>
                  </div>
                </div>

                <div className="mp3c-fs__pills">
                  <span className="mp3c-fs__pill mp3c-fs__pill--ogg">{t("oggPill")}</span>
                  <span className="mp3c-fs__pill mp3c-fs__pill--m4a">{t("m4aPill")}</span>
                  <span className="mp3c-fs__pill mp3c-fs__pill--bitrate">{t("bitratePill")}</span>
                </div>

                <div className="mp3c-fs__meta">
                  <span>{t("streamHint")}</span>
                  <span>{t("packHint")}</span>
                </div>
              </div>

              <span className="mp3c-fs__ok">
                <span className="mp3c-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="mp3c-fs__footer">
          <button type="button" className="mp3c-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="mp3c-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
