"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp3-compressor-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp3CompressorIntroGateProps = {
  /** When false, children render immediately (non–mp3-compressor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 Compressor.
 * MP3 card + pulsating wave → EQ laser / bitrate optimize → size shrink + clarity.
 * Only runs inside the ToolModal CALC embed.
 */
export function Mp3CompressorIntroGate({
  active = true,
  children,
}: Mp3CompressorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("Mp3CompressorLanding");
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

    document.documentElement.setAttribute("data-mp3-compress-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp3-compress-intro");
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
                <div className="mp3c-fs__card-top">
                  <span className="mp3c-fs__mp3">{t("mp3Badge")}</span>
                  <span className="mp3c-fs__file">{t("fileName")}</span>
                  <span className="mp3c-fs__bitrate">{t("bitrate")}</span>
                </div>

                <div className="mp3c-fs__wave-wrap">
                  <div className="mp3c-fs__wave">
                    {Array.from({ length: 32 }, (_, i) => (
                      <span key={i} style={{ ["--i" as string]: i }} />
                    ))}
                  </div>
                  <div className="mp3c-fs__eq-laser" />
                </div>

                <div className="mp3c-fs__eq">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className="mp3c-fs__eq-col">
                      <i style={{ ["--e" as string]: i }} />
                    </span>
                  ))}
                </div>

                <div className="mp3c-fs__meta">
                  <div className="mp3c-fs__size">
                    <span className="mp3c-fs__size-val mp3c-fs__size-val--a">{t("sizeFrom")}</span>
                    <span className="mp3c-fs__size-val mp3c-fs__size-val--b">{t("sizeMid")}</span>
                    <span className="mp3c-fs__size-val mp3c-fs__size-val--c">{t("sizeTo")}</span>
                  </div>
                  <span className="mp3c-fs__clarity">{t("clarity")}</span>
                </div>
              </div>
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
