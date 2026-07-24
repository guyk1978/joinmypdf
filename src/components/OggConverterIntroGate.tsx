"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./ogg-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type OggConverterIntroGateProps = {
  /** When false, children render immediately (non–ogg-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for OGG Converter.
 * .OGG Vorbis → laser remap node → .MP3 / .WAV / .AAC + OGG Transcoded.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function OggConverterIntroGate({
  active = true,
  children,
}: OggConverterIntroGateProps) {
  const introActive = active;
  const t = useTranslations("OggConverterLanding");
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

    document.documentElement.setAttribute("data-ogg-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-ogg-converter-intro");
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
        className="ogg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ogg-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ogg-fs__header">
          <h1 id="ogg-fs-title" className="ogg-fs__title">
            <span className="ogg-fs__title-brand">{t("brand")}</span>
            <span className="ogg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ogg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ogg-fs__stage" aria-hidden>
          <div className="ogg-fs__scene">
            <div className="ogg-fs__workspace animation-workspace">
              <div className="ogg-fs__card">
                <div className="ogg-fs__flow">
                  <span className="ogg-fs__tag ogg-fs__tag--src">{t("oggTag")}</span>
                  <div className="ogg-fs__node">
                    <span className="ogg-fs__node-core" />
                    <span className="ogg-fs__node-ring" />
                  </div>
                  <div className="ogg-fs__dests">
                    <span className="ogg-fs__tag ogg-fs__tag--mp3">{t("mp3Tag")}</span>
                    <span className="ogg-fs__tag ogg-fs__tag--wav">{t("wavTag")}</span>
                    <span className="ogg-fs__tag ogg-fs__tag--aac">{t("aacTag")}</span>
                  </div>
                </div>

                <div className="ogg-fs__wave-wrap">
                  <div className="ogg-fs__spectrum">
                    {Array.from({ length: 28 }, (_, i) => (
                      <span
                        key={i}
                        className="ogg-fs__bar"
                        style={{ animationDelay: `${(i % 14) * 0.07}s` }}
                      />
                    ))}
                  </div>
                  <div className="ogg-fs__laser" />
                </div>

                <div className="ogg-fs__pills">
                  <span className="ogg-fs__pill ogg-fs__pill--flac">{t("flacPill")}</span>
                  <span className="ogg-fs__pill ogg-fs__pill--vorbis">{t("vorbisPill")}</span>
                  <span className="ogg-fs__pill ogg-fs__pill--pack">{t("packPill")}</span>
                </div>

                <div className="ogg-fs__meta">
                  <span>{t("streamHint")}</span>
                  <span>{t("packHint")}</span>
                </div>
              </div>

              <span className="ogg-fs__ok">
                <span className="ogg-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ogg-fs__footer">
          <button type="button" className="ogg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="ogg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
