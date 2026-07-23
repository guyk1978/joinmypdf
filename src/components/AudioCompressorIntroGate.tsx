"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./audio-compressor-landing.css";

type IntroPhase = "intro" | "workspace";

type AudioCompressorIntroGateProps = {
  /** When false, children render immediately (non–audio-compressor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Audio Compressor.
 * Waveform card → optimization beam → size shrink + high-fidelity lock.
 * Only runs inside the ToolModal CALC embed.
 */
export function AudioCompressorIntroGate({
  active = true,
  children,
}: AudioCompressorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("AudioCompressorLanding");
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

    document.documentElement.setAttribute("data-audio-compress-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-audio-compress-intro");
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
        className="audc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audc-fs-title"
      >
        <header className="audc-fs__header">
          <h1 id="audc-fs-title" className="audc-fs__title">
            <span className="audc-fs__title-brand">{t("brand")}</span>
            <span className="audc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="audc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="audc-fs__stage" aria-hidden>
          <div className="audc-fs__scene">
            <div className="audc-fs__workspace animation-workspace">
              <div className="audc-fs__pulses">
                <span /><span /><span />
              </div>

              <div className="audc-fs__card">
                <div className="audc-fs__card-top">
                  <span className="audc-fs__fmt">{t("fmtBadge")}</span>
                  <span className="audc-fs__file">{t("fileName")}</span>
                </div>

                <div className="audc-fs__wave-wrap">
                  <div className="audc-fs__wave">
                    {Array.from({ length: 28 }, (_, i) => (
                      <span key={i} style={{ ["--i" as string]: i }} />
                    ))}
                  </div>
                  <div className="audc-fs__beam" />
                </div>

                <div className="audc-fs__spectrum">
                  {Array.from({ length: 12 }, (_, i) => (
                    <span key={i} style={{ ["--s" as string]: i }} />
                  ))}
                </div>

                <div className="audc-fs__meta">
                  <div className="audc-fs__size">
                    <span className="audc-fs__size-val audc-fs__size-val--a">{t("sizeFrom")}</span>
                    <span className="audc-fs__size-val audc-fs__size-val--b">{t("sizeMid")}</span>
                    <span className="audc-fs__size-val audc-fs__size-val--c">{t("sizeTo")}</span>
                  </div>
                  <span className="audc-fs__fidelity">{t("fidelity")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="audc-fs__footer">
          <button type="button" className="audc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="audc-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
