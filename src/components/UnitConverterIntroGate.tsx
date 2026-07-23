"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./unit-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type UnitConverterIntroGateProps = {
  /** When false, children render immediately (non–unit-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Unit Converter.
 * Length/weight/temp scales shift Metric → Imperial with glowing badges.
 * Only runs inside the ToolModal CALC embed.
 */
export function UnitConverterIntroGate({
  active = true,
  children,
}: UnitConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("UnitConverterLanding");
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

    document.documentElement.setAttribute("data-unit-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-unit-converter-intro");
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
        className="uc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="uc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="uc-fs__header">
          <h1 id="uc-fs-title" className="uc-fs__title">
            <span className="uc-fs__title-brand">{t("brand")}</span>
            <span className="uc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="uc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="uc-fs__stage" aria-hidden>
          <div className="uc-fs__scene">
            <div className="uc-fs__workspace animation-workspace">
              <div className="uc-fs__card">
                <div className="uc-fs__systems">
                  <span className="uc-fs__sys uc-fs__sys--metric">{t("metric")}</span>
                  <span className="uc-fs__arrow" />
                  <span className="uc-fs__sys uc-fs__sys--imperial">{t("imperial")}</span>
                </div>

                <div className="uc-fs__rows">
                  <div className="uc-fs__row uc-fs__row--len">
                    <span className="uc-fs__dim">{t("length")}</span>
                    <div className="uc-fs__scale">
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__needle" />
                    </div>
                    <span className="uc-fs__pair">
                      <span className="uc-fs__from">100 cm</span>
                      <span className="uc-fs__to">39.4 in</span>
                    </span>
                  </div>

                  <div className="uc-fs__row uc-fs__row--wt">
                    <span className="uc-fs__dim">{t("weight")}</span>
                    <div className="uc-fs__scale">
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__tick" />
                      <span className="uc-fs__needle" />
                    </div>
                    <span className="uc-fs__pair">
                      <span className="uc-fs__from">1 kg</span>
                      <span className="uc-fs__to">2.2 lb</span>
                    </span>
                  </div>

                  <div className="uc-fs__row uc-fs__row--temp">
                    <span className="uc-fs__dim">{t("temp")}</span>
                    <div className="uc-fs__scale uc-fs__scale--temp">
                      <span className="uc-fs__thermo" />
                      <span className="uc-fs__mercury" />
                    </div>
                    <span className="uc-fs__pair">
                      <span className="uc-fs__from">20 °C</span>
                      <span className="uc-fs__to">68 °F</span>
                    </span>
                  </div>
                </div>
              </div>

              <span className="uc-fs__ok">
                <span className="uc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="uc-fs__footer">
          <button type="button" className="uc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="uc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
