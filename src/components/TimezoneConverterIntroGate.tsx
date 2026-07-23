"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./timezone-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type TimezoneConverterIntroGateProps = {
  /** When false, children render immediately (non–timezone-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Timezone Converter.
 * Digital clocks sync across cities; UTC offset badges convert; success check.
 * Only runs inside the ToolModal CALC embed.
 */
export function TimezoneConverterIntroGate({
  active = true,
  children,
}: TimezoneConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("TimezoneConverterLanding");
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

    document.documentElement.setAttribute("data-timezone-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-timezone-converter-intro");
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
        className="tzc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tzc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="tzc-fs__header">
          <h1 id="tzc-fs-title" className="tzc-fs__title">
            <span className="tzc-fs__title-brand">{t("brand")}</span>
            <span className="tzc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="tzc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="tzc-fs__stage" aria-hidden>
          <div className="tzc-fs__scene">
            <div className="tzc-fs__workspace animation-workspace">
              <div className="tzc-fs__card">
                <div className="tzc-fs__offset-row">
                  <span className="tzc-fs__offset tzc-fs__offset--from">{t("offsetFrom")}</span>
                  <span className="tzc-fs__arrow" />
                  <span className="tzc-fs__offset tzc-fs__offset--to">{t("offsetTo")}</span>
                </div>

                <div className="tzc-fs__cities">
                  <div className="tzc-fs__city tzc-fs__city--a">
                    <span className="tzc-fs__city-name">{t("cityA")}</span>
                    <div className="tzc-fs__digits">
                      <span className="tzc-fs__digit tzc-fs__digit--h1">1</span>
                      <span className="tzc-fs__digit tzc-fs__digit--h2">4</span>
                      <span className="tzc-fs__colon">:</span>
                      <span className="tzc-fs__digit">3</span>
                      <span className="tzc-fs__digit">0</span>
                    </div>
                  </div>

                  <div className="tzc-fs__city tzc-fs__city--b">
                    <span className="tzc-fs__city-name">{t("cityB")}</span>
                    <div className="tzc-fs__digits tzc-fs__digits--sync">
                      <span className="tzc-fs__digit tzc-fs__digit--flip-h1">
                        <span className="tzc-fs__flip">
                          <span className="tzc-fs__flip-a">1</span>
                          <span className="tzc-fs__flip-b">0</span>
                        </span>
                      </span>
                      <span className="tzc-fs__digit tzc-fs__digit--flip-h2">
                        <span className="tzc-fs__flip">
                          <span className="tzc-fs__flip-a">4</span>
                          <span className="tzc-fs__flip-b">8</span>
                        </span>
                      </span>
                      <span className="tzc-fs__colon">:</span>
                      <span className="tzc-fs__digit">3</span>
                      <span className="tzc-fs__digit">0</span>
                    </div>
                  </div>

                  <div className="tzc-fs__city tzc-fs__city--c">
                    <span className="tzc-fs__city-name">{t("cityC")}</span>
                    <div className="tzc-fs__digits tzc-fs__digits--sync-late">
                      <span className="tzc-fs__digit tzc-fs__digit--flip-h1">
                        <span className="tzc-fs__flip">
                          <span className="tzc-fs__flip-a">1</span>
                          <span className="tzc-fs__flip-b">2</span>
                        </span>
                      </span>
                      <span className="tzc-fs__digit tzc-fs__digit--flip-h2">
                        <span className="tzc-fs__flip">
                          <span className="tzc-fs__flip-a">4</span>
                          <span className="tzc-fs__flip-b">1</span>
                        </span>
                      </span>
                      <span className="tzc-fs__colon">:</span>
                      <span className="tzc-fs__digit">3</span>
                      <span className="tzc-fs__digit">0</span>
                    </div>
                  </div>
                </div>

                <div className="tzc-fs__pulse" />
              </div>

              <span className="tzc-fs__ok">
                <span className="tzc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="tzc-fs__footer">
          <button type="button" className="tzc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="tzc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
