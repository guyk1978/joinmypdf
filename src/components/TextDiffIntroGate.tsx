"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./text-diff-landing.css";

type IntroPhase = "intro" | "workspace";

type TextDiffIntroGateProps = {
  /** When false, children render immediately (non–text-diff tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Text Diff.
 * Original vs modified panes → Myers diff node + highlight sweeps → success.
 * Shows before the comparison workspace (embed modal and dedicated tool page).
 */
export function TextDiffIntroGate({
  active = true,
  children,
}: TextDiffIntroGateProps) {
  const introActive = active;
  const t = useTranslations("TextDiffLanding");
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

    document.documentElement.setAttribute("data-text-diff-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-text-diff-intro");
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
        className="td-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="td-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="td-fs__header">
          <h1 id="td-fs-title" className="td-fs__title">
            <span className="td-fs__title-brand">{t("brand")}</span>
            <span className="td-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="td-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="td-fs__stage" aria-hidden>
          <div className="td-fs__scene">
            <div className="td-fs__workspace animation-workspace">
              <div className="td-fs__card">
                <div className="td-fs__pipeline">
                  <div className="td-fs__pane td-fs__pane--orig">
                    <span className="td-fs__tag">{t("originalTag")}</span>
                    <div className="td-fs__lines">
                      <span className="td-fs__line">{t("lineSame1")}</span>
                      <span className="td-fs__line td-fs__line--removed">{t("lineRemoved")}</span>
                      <span className="td-fs__line">{t("lineSame2")}</span>
                      <span className="td-fs__line td-fs__line--ghost" />
                      <span className="td-fs__sweep td-fs__sweep--remove" />
                    </div>
                  </div>

                  <div className="td-fs__engine">
                    <span className="td-fs__flow" />
                    <span className="td-fs__core" />
                    <span className="td-fs__algo">{t("algoBadge")}</span>
                  </div>

                  <div className="td-fs__pane td-fs__pane--mod">
                    <span className="td-fs__tag td-fs__tag--mod">{t("modifiedTag")}</span>
                    <div className="td-fs__lines">
                      <span className="td-fs__line">{t("lineSame1")}</span>
                      <span className="td-fs__line td-fs__line--added">{t("lineAdded")}</span>
                      <span className="td-fs__line">{t("lineSame2")}</span>
                      <span className="td-fs__line td-fs__line--added td-fs__line--added2">
                        {t("lineAdded2")}
                      </span>
                      <span className="td-fs__sweep td-fs__sweep--add" />
                    </div>
                  </div>
                </div>

                <span className="td-fs__particle td-fs__particle--1" />
                <span className="td-fs__particle td-fs__particle--2" />
                <span className="td-fs__particle td-fs__particle--3" />
              </div>

              <span className="td-fs__ok">
                <span className="td-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="td-fs__footer">
          <button type="button" className="td-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="td-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
