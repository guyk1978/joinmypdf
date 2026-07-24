"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp3-volume-booster-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp3VolumeBoosterIntroGateProps = {
  /** When false, children render immediately (non–mp3-volume-booster tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 Volume Booster.
 * Quiet wave → gain dial to +15dB → neon amplitude expand + peak limit + Volume Boosted.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function Mp3VolumeBoosterIntroGate({
  active = true,
  children,
}: Mp3VolumeBoosterIntroGateProps) {
  const introActive = active;
  const t = useTranslations("Mp3VolumeBoosterLanding");
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

    document.documentElement.setAttribute("data-mp3-volume-booster-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp3-volume-booster-intro");
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
        className="mvb-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mvb-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="mvb-fs__header">
          <h1 id="mvb-fs-title" className="mvb-fs__title">
            <span className="mvb-fs__title-brand">{t("brand")}</span>
            <span className="mvb-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="mvb-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="mvb-fs__stage" aria-hidden>
          <div className="mvb-fs__scene">
            <div className="mvb-fs__workspace animation-workspace">
              <div className="mvb-fs__card">
                <div className="mvb-fs__gain-row">
                  <span className="mvb-fs__gain-label">{t("gainLabel")}</span>
                  <div className="mvb-fs__slider">
                    <span className="mvb-fs__track" />
                    <span className="mvb-fs__fill" />
                    <span className="mvb-fs__thumb" />
                  </div>
                  <span className="mvb-fs__gain-value">
                    <span className="mvb-fs__gain-from">{t("gain0")}</span>
                    <span className="mvb-fs__gain-to">{t("gain15")}</span>
                  </span>
                </div>

                <div className="mvb-fs__wave-wrap">
                  <div className="mvb-fs__peak-cap mvb-fs__peak-cap--top" />
                  <div className="mvb-fs__peak-cap mvb-fs__peak-cap--bottom" />
                  <div className="mvb-fs__spectrum">
                    {Array.from({ length: 28 }, (_, i) => (
                      <span
                        key={i}
                        className="mvb-fs__bar"
                        style={{ animationDelay: `${(i % 14) * 0.06}s` }}
                      />
                    ))}
                  </div>
                  <div className="mvb-fs__neon" />
                  <div className="mvb-fs__limiter">
                    <span className="mvb-fs__limiter-dot" />
                    {t("limiter")}
                  </div>
                </div>

                <div className="mvb-fs__pills">
                  <span className="mvb-fs__pill mvb-fs__pill--10">{t("pill10")}</span>
                  <span className="mvb-fs__pill mvb-fs__pill--15">{t("pill15")}</span>
                  <span className="mvb-fs__pill mvb-fs__pill--20">{t("pill20")}</span>
                </div>
              </div>

              <span className="mvb-fs__ok">
                <span className="mvb-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="mvb-fs__footer">
          <button type="button" className="mvb-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="mvb-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
