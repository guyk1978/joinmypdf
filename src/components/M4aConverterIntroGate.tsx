"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./m4a-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type M4aConverterIntroGateProps = {
  /** When false, children render immediately (non–m4a-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for M4A Converter.
 * Wave spectrum → bitrate node → MP3/WAV/AAC/OGG packaging + Audio Transcoded.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function M4aConverterIntroGate({
  active = true,
  children,
}: M4aConverterIntroGateProps) {
  const introActive = active;
  const t = useTranslations("M4aConverterLanding");
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

    document.documentElement.setAttribute("data-m4a-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-m4a-converter-intro");
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
        className="m4a-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m4a-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="m4a-fs__header">
          <h1 id="m4a-fs-title" className="m4a-fs__title">
            <span className="m4a-fs__title-brand">{t("brand")}</span>
            <span className="m4a-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="m4a-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="m4a-fs__stage" aria-hidden>
          <div className="m4a-fs__scene">
            <div className="m4a-fs__workspace animation-workspace">
              <div className="m4a-fs__card">
                <div className="m4a-fs__flow">
                  <span className="m4a-fs__tag m4a-fs__tag--src">{t("m4aTag")}</span>
                  <div className="m4a-fs__node">
                    <span className="m4a-fs__node-core" />
                    <span className="m4a-fs__node-ring" />
                  </div>
                  <div className="m4a-fs__dests">
                    <span className="m4a-fs__tag m4a-fs__tag--mp3">{t("mp3Tag")}</span>
                    <span className="m4a-fs__tag m4a-fs__tag--wav">{t("wavTag")}</span>
                  </div>
                </div>

                <div className="m4a-fs__wave-wrap">
                  <div className="m4a-fs__spectrum">
                    {Array.from({ length: 28 }, (_, i) => (
                      <span
                        key={i}
                        className="m4a-fs__bar"
                        style={{ animationDelay: `${(i % 14) * 0.07}s` }}
                      />
                    ))}
                  </div>
                  <div className="m4a-fs__laser" />
                  <div className="m4a-fs__desat" />
                </div>

                <div className="m4a-fs__pills">
                  <span className="m4a-fs__pill m4a-fs__pill--aac">{t("aacTag")}</span>
                  <span className="m4a-fs__pill m4a-fs__pill--ogg">{t("oggTag")}</span>
                  <span className="m4a-fs__pill m4a-fs__pill--bitrate">{t("bitrate")}</span>
                </div>

                <div className="m4a-fs__meta">
                  <span>{t("streamHint")}</span>
                  <span>{t("packHint")}</span>
                </div>
              </div>

              <span className="m4a-fs__ok">
                <span className="m4a-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="m4a-fs__footer">
          <button type="button" className="m4a-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="m4a-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
