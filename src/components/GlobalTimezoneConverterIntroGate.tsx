"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./global-timezone-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type GlobalTimezoneConverterIntroGateProps = {
  /** When false, children render immediately (non–global-timezone-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Global Time Zone Converter.
 * World map + city cards sync via beams; GMT → EST → JST badges light up.
 * Only runs inside the ToolModal CALC embed.
 */
export function GlobalTimezoneConverterIntroGate({
  active = true,
  children,
}: GlobalTimezoneConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("GlobalTimezoneConverterLanding");
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

    document.documentElement.setAttribute("data-global-timezone-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-global-timezone-converter-intro");
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
        className="gtz-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gtz-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="gtz-fs__header">
          <h1 id="gtz-fs-title" className="gtz-fs__title">
            <span className="gtz-fs__title-brand">{t("brand")}</span>
            <span className="gtz-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="gtz-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="gtz-fs__stage" aria-hidden>
          <div className="gtz-fs__scene">
            <div className="gtz-fs__workspace animation-workspace">
              <div className="gtz-fs__card">
                <div className="gtz-fs__regions">
                  <span className="gtz-fs__region gtz-fs__region--gmt">{t("gmt")}</span>
                  <span className="gtz-fs__pipe" />
                  <span className="gtz-fs__region gtz-fs__region--est">{t("est")}</span>
                  <span className="gtz-fs__pipe gtz-fs__pipe--late" />
                  <span className="gtz-fs__region gtz-fs__region--jst">{t("jst")}</span>
                </div>

                <div className="gtz-fs__preview">
                  <div className="gtz-fs__map">
                    <span className="gtz-fs__land gtz-fs__land--w" />
                    <span className="gtz-fs__land gtz-fs__land--e" />
                    <span className="gtz-fs__land gtz-fs__land--s" />
                    <span className="gtz-fs__node gtz-fs__node--1" />
                    <span className="gtz-fs__node gtz-fs__node--2" />
                    <span className="gtz-fs__node gtz-fs__node--3" />
                    <span className="gtz-fs__beam gtz-fs__beam--a" />
                    <span className="gtz-fs__beam gtz-fs__beam--b" />
                  </div>

                  <div className="gtz-fs__cities">
                    <div className="gtz-fs__city gtz-fs__city--1">
                      <span className="gtz-fs__city-name">{t("cityLondon")}</span>
                      <span className="gtz-fs__time">09:00</span>
                    </div>
                    <div className="gtz-fs__city gtz-fs__city--2">
                      <span className="gtz-fs__city-name">{t("cityNy")}</span>
                      <span className="gtz-fs__time">04:00</span>
                    </div>
                    <div className="gtz-fs__city gtz-fs__city--3">
                      <span className="gtz-fs__city-name">{t("cityTokyo")}</span>
                      <span className="gtz-fs__time">18:00</span>
                    </div>
                  </div>
                </div>
              </div>

              <span className="gtz-fs__ok">
                <span className="gtz-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="gtz-fs__footer">
          <button type="button" className="gtz-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="gtz-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
