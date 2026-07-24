"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./text-diff-checker-landing.css";

type IntroPhase = "intro" | "workspace";

type TextDiffCheckerIntroGateProps = {
  /** When false, children render immediately (non–text-diff-checker tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Text Diff Checker.
 * Source windows → delta matrix engine + cross-beam scan → change-tracked output → synced.
 * Shows before the side-by-side diff workspace (embed modal and dynamic tool route).
 */
export function TextDiffCheckerIntroGate({
  active = true,
  children,
}: TextDiffCheckerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("TextDiffCheckerLanding");
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

    document.documentElement.setAttribute("data-text-diff-checker-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-text-diff-checker-intro");
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
        className="tdc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tdc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="tdc-fs__header">
          <h1 id="tdc-fs-title" className="tdc-fs__title">
            <span className="tdc-fs__title-brand">{t("brand")}</span>
            <span className="tdc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="tdc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="tdc-fs__stage" aria-hidden>
          <div className="tdc-fs__scene">
            <div className="tdc-fs__workspace animation-workspace">
              <div className="tdc-fs__card">
                <div className="tdc-fs__pipeline">
                  <div className="tdc-fs__pane tdc-fs__pane--source">
                    <span className="tdc-fs__tag">{t("sourceTag")}</span>
                    <div className="tdc-fs__lines">
                      <span className="tdc-fs__line">{t("lineSame1")}</span>
                      <span className="tdc-fs__line tdc-fs__line--removed">{t("lineRemoved")}</span>
                      <span className="tdc-fs__line">{t("lineSame2")}</span>
                      <span className="tdc-fs__line tdc-fs__line--ghost" />
                      <span className="tdc-fs__beam tdc-fs__beam--source" />
                    </div>
                  </div>

                  <div className="tdc-fs__engine">
                    <span className="tdc-fs__flow" />
                    <span className="tdc-fs__matrix">
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell tdc-fs__matrix-cell--hot" />
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell" />
                      <span className="tdc-fs__matrix-cell" />
                    </span>
                    <span className="tdc-fs__delta">{t("deltaBadge")}</span>
                  </div>

                  <div className="tdc-fs__pane tdc-fs__pane--tracked">
                    <span className="tdc-fs__tag tdc-fs__tag--tracked">{t("trackedTag")}</span>
                    <div className="tdc-fs__lines">
                      <span className="tdc-fs__line">{t("lineSame1")}</span>
                      <span className="tdc-fs__line tdc-fs__line--added">{t("lineAdded")}</span>
                      <span className="tdc-fs__line">{t("lineSame2")}</span>
                      <span className="tdc-fs__line tdc-fs__line--added tdc-fs__line--added2">
                        {t("lineAdded2")}
                      </span>
                      <span className="tdc-fs__beam tdc-fs__beam--tracked" />
                    </div>
                  </div>
                </div>

                <span className="tdc-fs__particle tdc-fs__particle--1" />
                <span className="tdc-fs__particle tdc-fs__particle--2" />
                <span className="tdc-fs__particle tdc-fs__particle--3" />
              </div>

              <span className="tdc-fs__ok">
                <span className="tdc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="tdc-fs__footer">
          <button type="button" className="tdc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="tdc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
