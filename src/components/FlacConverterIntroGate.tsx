"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./flac-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type FlacConverterIntroGateProps = {
  /** When false, children render immediately (non–flac-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for FLAC Converter.
 * FLAC card → compatibility beam → .mp3 / .wav badges + fidelity lock.
 * Only runs inside the ToolModal CALC embed.
 */
export function FlacConverterIntroGate({
  active = true,
  children,
}: FlacConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FlacConverterLanding");
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

    document.documentElement.setAttribute("data-flac-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-flac-converter-intro");
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
        className="flac-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flac-fs-title"
      >
        <header className="flac-fs__header">
          <h1 id="flac-fs-title" className="flac-fs__title">
            <span className="flac-fs__title-brand">{t("brand")}</span>
            <span className="flac-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="flac-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="flac-fs__stage" aria-hidden>
          <div className="flac-fs__scene">
            <div className="flac-fs__workspace animation-workspace">
              <div className="flac-fs__card">
                <div className="flac-fs__formats">
                  <span className="flac-fs__tag flac-fs__tag--src">{t("flacTag")}</span>
                  <span className="flac-fs__arrow" />
                  <div className="flac-fs__dests">
                    <span className="flac-fs__tag flac-fs__tag--mp3">{t("mp3Tag")}</span>
                    <span className="flac-fs__tag flac-fs__tag--wav">{t("wavTag")}</span>
                  </div>
                </div>

                <div className="flac-fs__wave-wrap">
                  <div className="flac-fs__wave" />
                  <div className="flac-fs__beam" />
                  <div className="flac-fs__fidelity">
                    <span className="flac-fs__fid-dot" />
                    {t("fidelity")}
                  </div>
                </div>

                <div className="flac-fs__meta">
                  <span>{t("lossless")}</span>
                  <span>{t("playAnywhere")}</span>
                </div>
              </div>

              <span className="flac-fs__ok">
                <span className="flac-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="flac-fs__footer">
          <button type="button" className="flac-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="flac-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
