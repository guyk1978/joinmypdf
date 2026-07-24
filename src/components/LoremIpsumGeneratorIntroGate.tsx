"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./lorem-ipsum-generator-landing.css";

type IntroPhase = "intro" | "workspace";

type LoremIpsumGeneratorIntroGateProps = {
  /** When false, children render immediately (non–lorem-ipsum-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Lorem Ipsum Generator.
 * Control sliders → typography assembly node → typing Latin blocks + success.
 * Shows before the generator workspace (embed modal and dedicated tool page).
 */
export function LoremIpsumGeneratorIntroGate({
  active = true,
  children,
}: LoremIpsumGeneratorIntroGateProps) {
  const introActive = active;
  const t = useTranslations("LoremIpsumGeneratorLanding");
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

    document.documentElement.setAttribute("data-lorem-ipsum-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-lorem-ipsum-intro");
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
        className="lig-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lig-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="lig-fs__header">
          <h1 id="lig-fs-title" className="lig-fs__title">
            <span className="lig-fs__title-brand">{t("brand")}</span>
            <span className="lig-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="lig-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="lig-fs__stage" aria-hidden>
          <div className="lig-fs__scene">
            <div className="lig-fs__workspace animation-workspace">
              <div className="lig-fs__card">
                <div className="lig-fs__pipeline">
                  <div className="lig-fs__controls">
                    <span className="lig-fs__tag">{t("controlsTag")}</span>
                    <div className="lig-fs__slider lig-fs__slider--paras">
                      <span className="lig-fs__slider-label">{t("paragraphsLabel")}</span>
                      <span className="lig-fs__slider-track">
                        <span className="lig-fs__slider-fill" />
                        <span className="lig-fs__slider-thumb" />
                      </span>
                      <span className="lig-fs__slider-value">3</span>
                    </div>
                    <div className="lig-fs__slider lig-fs__slider--words">
                      <span className="lig-fs__slider-label">{t("wordsLabel")}</span>
                      <span className="lig-fs__slider-track">
                        <span className="lig-fs__slider-fill" />
                        <span className="lig-fs__slider-thumb" />
                      </span>
                      <span className="lig-fs__slider-value">48</span>
                    </div>
                    <div className="lig-fs__format-row">
                      <span className="lig-fs__format-pill">{t("formatHtml")}</span>
                      <span className="lig-fs__format-pill lig-fs__format-pill--active">
                        {t("formatPlain")}
                      </span>
                    </div>
                  </div>

                  <div className="lig-fs__engine">
                    <span className="lig-fs__flow" />
                    <span className="lig-fs__glyph lig-fs__glyph--1">L</span>
                    <span className="lig-fs__glyph lig-fs__glyph--2">i</span>
                    <span className="lig-fs__glyph lig-fs__glyph--3">p</span>
                    <span className="lig-fs__core" />
                    <span className="lig-fs__format-badge">{t("formatBadge")}</span>
                  </div>

                  <div className="lig-fs__output">
                    <span className="lig-fs__tag lig-fs__tag--out">{t("outputTag")}</span>
                    <div className="lig-fs__blocks">
                      <p className="lig-fs__block lig-fs__block--1">
                        <span className="lig-fs__type">{t("sampleLine1")}</span>
                      </p>
                      <p className="lig-fs__block lig-fs__block--2">
                        <span className="lig-fs__type">{t("sampleLine2")}</span>
                      </p>
                      <p className="lig-fs__block lig-fs__block--3">
                        <span className="lig-fs__type">{t("sampleLine3")}</span>
                      </p>
                    </div>
                    <span className="lig-fs__caret" />
                  </div>
                </div>

                <span className="lig-fs__particle lig-fs__particle--1" />
                <span className="lig-fs__particle lig-fs__particle--2" />
                <span className="lig-fs__particle lig-fs__particle--3" />
              </div>

              <span className="lig-fs__ok">
                <span className="lig-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="lig-fs__footer">
          <button type="button" className="lig-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="lig-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
