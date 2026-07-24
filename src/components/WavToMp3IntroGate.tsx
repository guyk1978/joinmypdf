"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./wav-to-mp3-landing.css";

type IntroPhase = "intro" | "workspace";

type WavToMp3IntroGateProps = {
  /** When false, children render immediately (non–wav-to-mp3 tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for WAV to MP3 Converter.
 * Heavy WAV PCM → laser encoder compress → compact MP3 320kbps + Converted to MP3.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function WavToMp3IntroGate({
  active = true,
  children,
}: WavToMp3IntroGateProps) {
  const introActive = active;
  const t = useTranslations("WavToMp3Landing");
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

    document.documentElement.setAttribute("data-wav-to-mp3-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-wav-to-mp3-intro");
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
        className="w2m-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="w2m-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="w2m-fs__header">
          <h1 id="w2m-fs-title" className="w2m-fs__title">
            <span className="w2m-fs__title-brand">{t("brand")}</span>
            <span className="w2m-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="w2m-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="w2m-fs__stage" aria-hidden>
          <div className="w2m-fs__scene">
            <div className="w2m-fs__workspace animation-workspace">
              <div className="w2m-fs__card">
                <div className="w2m-fs__panels">
                  <div className="w2m-fs__panel w2m-fs__panel--wav">
                    <span className="w2m-fs__tag w2m-fs__tag--wav">{t("wavTag")}</span>
                    <div className="w2m-fs__eq w2m-fs__eq--hd">
                      {Array.from({ length: 18 }, (_, i) => (
                        <span
                          key={i}
                          className="w2m-fs__bar w2m-fs__bar--hd"
                          style={{ animationDelay: `${(i % 9) * 0.05}s` }}
                        />
                      ))}
                    </div>
                    <span className="w2m-fs__panel-hint">{t("wavHint")}</span>
                  </div>

                  <div className="w2m-fs__pipe">
                    <span className="w2m-fs__pipe-line" />
                    <span className="w2m-fs__pipe-core" />
                    <span className="w2m-fs__laser" />
                    <span className="w2m-fs__shrink">{t("sizeCut")}</span>
                  </div>

                  <div className="w2m-fs__panel w2m-fs__panel--mp3">
                    <span className="w2m-fs__tag w2m-fs__tag--mp3">{t("mp3Tag")}</span>
                    <div className="w2m-fs__eq w2m-fs__eq--compact">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span
                          key={i}
                          className="w2m-fs__bar w2m-fs__bar--compact"
                          style={{ animationDelay: `${(i % 5) * 0.08}s` }}
                        />
                      ))}
                    </div>
                    <span className="w2m-fs__panel-hint">{t("mp3Hint")}</span>
                  </div>
                </div>

                <div className="w2m-fs__pills">
                  <span className="w2m-fs__pill w2m-fs__pill--wav">{t("wavPill")}</span>
                  <span className="w2m-fs__pill w2m-fs__pill--vbr">{t("vbrPill")}</span>
                  <span className="w2m-fs__pill w2m-fs__pill--mp3">{t("mp3Pill")}</span>
                </div>

                <span className="w2m-fs__particle w2m-fs__particle--1" />
                <span className="w2m-fs__particle w2m-fs__particle--2" />
                <span className="w2m-fs__particle w2m-fs__particle--3" />
                <span className="w2m-fs__particle w2m-fs__particle--4" />
              </div>

              <span className="w2m-fs__ok">
                <span className="w2m-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="w2m-fs__footer">
          <button type="button" className="w2m-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="w2m-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
