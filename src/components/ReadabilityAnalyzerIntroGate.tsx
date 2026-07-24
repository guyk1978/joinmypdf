"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./readability-analyzer-landing.css";

type IntroPhase = "intro" | "workspace";

type ReadabilityAnalyzerIntroGateProps = {
  /** When false, children render immediately (non–readability-analyzer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Readability Analyzer.
 * Dense text → linguistics parser + laser → grade gauges + Flesch badge.
 * Shows before the analyzer workspace (embed modal and dedicated tool page).
 */
export function ReadabilityAnalyzerIntroGate({
  active = true,
  children,
}: ReadabilityAnalyzerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("ReadabilityAnalyzerLanding");
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

    document.documentElement.setAttribute("data-readability-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-readability-intro");
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
        className="ra-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ra-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ra-fs__header">
          <h1 id="ra-fs-title" className="ra-fs__title">
            <span className="ra-fs__title-brand">{t("brand")}</span>
            <span className="ra-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ra-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ra-fs__stage" aria-hidden>
          <div className="ra-fs__scene">
            <div className="ra-fs__workspace animation-workspace">
              <div className="ra-fs__card">
                <div className="ra-fs__pipeline">
                  <div className="ra-fs__draft">
                    <span className="ra-fs__tag">{t("draftTag")}</span>
                    <div className="ra-fs__text">
                      <span className="ra-fs__line ra-fs__line--1" />
                      <span className="ra-fs__line ra-fs__line--2 ra-fs__line--complex" />
                      <span className="ra-fs__line ra-fs__line--3" />
                      <span className="ra-fs__line ra-fs__line--4 ra-fs__line--complex" />
                      <span className="ra-fs__line ra-fs__line--5" />
                      <span className="ra-fs__laser" />
                    </div>
                    <span className="ra-fs__metric">{t("fleschBadge")}</span>
                  </div>

                  <div className="ra-fs__engine">
                    <span className="ra-fs__flow" />
                    <span className="ra-fs__core">
                      <span className="ra-fs__core-label">{t("parserLabel")}</span>
                    </span>
                    <span className="ra-fs__pulse" />
                  </div>

                  <div className="ra-fs__dashboard">
                    <span className="ra-fs__tag ra-fs__tag--out">{t("dashboardTag")}</span>
                    <div className="ra-fs__gauges">
                      <div className="ra-fs__gauge">
                        <span className="ra-fs__gauge-label">{t("levelCollege")}</span>
                        <span className="ra-fs__gauge-track">
                          <span className="ra-fs__gauge-fill ra-fs__gauge-fill--hard" />
                        </span>
                      </div>
                      <div className="ra-fs__gauge">
                        <span className="ra-fs__gauge-label">{t("levelEasy")}</span>
                        <span className="ra-fs__gauge-track">
                          <span className="ra-fs__gauge-fill ra-fs__gauge-fill--easy" />
                        </span>
                      </div>
                    </div>
                    <div className="ra-fs__scores">
                      <span className="ra-fs__score-pill">{t("fkBadge")}</span>
                      <span className="ra-fs__score-pill ra-fs__score-pill--fog">{t("fogBadge")}</span>
                    </div>
                  </div>
                </div>

                <span className="ra-fs__particle ra-fs__particle--1" />
                <span className="ra-fs__particle ra-fs__particle--2" />
                <span className="ra-fs__particle ra-fs__particle--3" />
              </div>

              <span className="ra-fs__ok">
                <span className="ra-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ra-fs__footer">
          <button type="button" className="ra-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ra-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
