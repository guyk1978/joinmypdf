"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./audio-merger-landing.css";

type IntroPhase = "intro" | "workspace";

type AudioMergerIntroGateProps = {
  /** When false, children render immediately (non–audio-merger tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Audio Merger.
 * Multiple waveform tracks → glide inward → stitch into one master track.
 * Only runs inside the ToolModal CALC embed.
 */
export function AudioMergerIntroGate({
  active = true,
  children,
}: AudioMergerIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("AudioMergerLanding");
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

    document.documentElement.setAttribute("data-audio-merger-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-audio-merger-intro");
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
        className="amrg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amrg-fs-title"
      >
        <header className="amrg-fs__header">
          <h1 id="amrg-fs-title" className="amrg-fs__title">
            <span className="amrg-fs__title-brand">{t("brand")}</span>
            <span className="amrg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="amrg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="amrg-fs__stage" aria-hidden>
          <div className="amrg-fs__scene">
            <div className="amrg-fs__workspace animation-workspace">
              <div className="amrg-fs__tracks">
                <div className="amrg-fs__track amrg-fs__track--a">
                  <span className="amrg-fs__track-label">{t("trackA")}</span>
                  <div className="amrg-fs__wave amrg-fs__wave--a" />
                </div>
                <div className="amrg-fs__track amrg-fs__track--b">
                  <span className="amrg-fs__track-label">{t("trackB")}</span>
                  <div className="amrg-fs__wave amrg-fs__wave--b" />
                </div>
                <div className="amrg-fs__track amrg-fs__track--c">
                  <span className="amrg-fs__track-label">{t("trackC")}</span>
                  <div className="amrg-fs__wave amrg-fs__wave--c" />
                </div>
              </div>

              <div className="amrg-fs__master">
                <div className="amrg-fs__master-card">
                  <div className="amrg-fs__master-head">
                    <span className="amrg-fs__master-badge">{t("masterBadge")}</span>
                    <span className="amrg-fs__time">{t("timestamp")}</span>
                  </div>
                  <div className="amrg-fs__master-wave" />
                  <div className="amrg-fs__stitches">
                    <span />
                    <span />
                  </div>
                </div>
                <span className="amrg-fs__ok">
                  <span className="amrg-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="amrg-fs__footer">
          <button type="button" className="amrg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="amrg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
