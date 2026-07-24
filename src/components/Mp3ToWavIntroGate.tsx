"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp3-to-wav-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp3ToWavIntroGateProps = {
  /** When false, children render immediately (non–mp3-to-wav tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 to WAV.
 * Compressed MP3 packet → laser expand → WAV 1411kbps PCM spectrum + Converted to WAV (Lossless).
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function Mp3ToWavIntroGate({
  active = true,
  children,
}: Mp3ToWavIntroGateProps) {
  const introActive = active;
  const t = useTranslations("Mp3ToWavLanding");
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

    document.documentElement.setAttribute("data-mp3-to-wav-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp3-to-wav-intro");
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
        className="m2w-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m2w-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="m2w-fs__header">
          <h1 id="m2w-fs-title" className="m2w-fs__title">
            <span className="m2w-fs__title-brand">{t("brand")}</span>
            <span className="m2w-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="m2w-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="m2w-fs__stage" aria-hidden>
          <div className="m2w-fs__scene">
            <div className="m2w-fs__workspace animation-workspace">
              <div className="m2w-fs__card">
                <div className="m2w-fs__panels">
                  <div className="m2w-fs__panel m2w-fs__panel--mp3">
                    <span className="m2w-fs__tag m2w-fs__tag--mp3">{t("mp3Tag")}</span>
                    <div className="m2w-fs__eq m2w-fs__eq--compact">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span
                          key={i}
                          className="m2w-fs__bar m2w-fs__bar--compact"
                          style={{ animationDelay: `${(i % 5) * 0.08}s` }}
                        />
                      ))}
                    </div>
                    <span className="m2w-fs__panel-hint">{t("mp3Hint")}</span>
                  </div>

                  <div className="m2w-fs__pipe">
                    <span className="m2w-fs__pipe-line" />
                    <span className="m2w-fs__pipe-core" />
                    <span className="m2w-fs__laser" />
                  </div>

                  <div className="m2w-fs__panel m2w-fs__panel--wav">
                    <span className="m2w-fs__tag m2w-fs__tag--wav">{t("wavTag")}</span>
                    <div className="m2w-fs__eq m2w-fs__eq--hd">
                      {Array.from({ length: 18 }, (_, i) => (
                        <span
                          key={i}
                          className="m2w-fs__bar m2w-fs__bar--hd"
                          style={{ animationDelay: `${(i % 9) * 0.05}s` }}
                        />
                      ))}
                    </div>
                    <span className="m2w-fs__panel-hint">{t("wavHint")}</span>
                  </div>
                </div>

                <div className="m2w-fs__pills">
                  <span className="m2w-fs__pill m2w-fs__pill--mp3">{t("mp3Pill")}</span>
                  <span className="m2w-fs__pill m2w-fs__pill--pcm">{t("pcmPill")}</span>
                  <span className="m2w-fs__pill m2w-fs__pill--wav">{t("wavPill")}</span>
                </div>

                <span className="m2w-fs__particle m2w-fs__particle--1" />
                <span className="m2w-fs__particle m2w-fs__particle--2" />
                <span className="m2w-fs__particle m2w-fs__particle--3" />
                <span className="m2w-fs__particle m2w-fs__particle--4" />
              </div>

              <span className="m2w-fs__ok">
                <span className="m2w-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="m2w-fs__footer">
          <button type="button" className="m2w-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="m2w-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
