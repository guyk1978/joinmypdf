"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./url-parameter-stripper-landing.css";

type IntroPhase = "intro" | "workspace";

type UrlParameterStripperIntroGateProps = {
  /** When false, children render immediately (non–url-parameter-stripper tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for URL Parameter Stripper.
 * Privacy laser dissolves tracking query params → clean /article link.
 * Only runs inside the ToolModal CALC embed.
 */
export function UrlParameterStripperIntroGate({
  active = true,
  children,
}: UrlParameterStripperIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("UrlParameterStripperLanding");
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

    document.documentElement.setAttribute("data-url-parameter-stripper-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-url-parameter-stripper-intro");
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
        className="ups-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ups-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ups-fs__header">
          <h1 id="ups-fs-title" className="ups-fs__title">
            <span className="ups-fs__title-brand">{t("brand")}</span>
            <span className="ups-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ups-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ups-fs__stage" aria-hidden>
          <div className="ups-fs__scene">
            <div className="ups-fs__workspace animation-workspace">
              <div className="ups-fs__card">
                <div className="ups-fs__status-row">
                  <span className="ups-fs__status ups-fs__status--dirty">{t("statusDirty")}</span>
                  <span className="ups-fs__status ups-fs__status--clean">{t("statusClean")}</span>
                </div>

                <div className="ups-fs__url-box">
                  <div className="ups-fs__url">
                    <span className="ups-fs__host">{t("host")}</span>
                    <span className="ups-fs__path">{t("path")}</span>
                    <span className="ups-fs__query">{t("query")}</span>
                  </div>
                  <span className="ups-fs__laser" />
                  <div className="ups-fs__tags">
                    <span className="ups-fs__tag ups-fs__tag--1">{t("tagUtm")}</span>
                    <span className="ups-fs__tag ups-fs__tag--2">{t("tagFb")}</span>
                  </div>
                </div>
              </div>

              <span className="ups-fs__ok">
                <span className="ups-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ups-fs__footer">
          <button type="button" className="ups-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ups-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
