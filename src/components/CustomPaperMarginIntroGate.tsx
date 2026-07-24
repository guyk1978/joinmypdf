"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./custom-paper-margin-landing.css";

type IntroPhase = "intro" | "workspace";

type CustomPaperMarginIntroGateProps = {
  /** When false, children render immediately (non–custom-paper-margin tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Adjust PDF Paper Size & Margins.
 * A page morphs between paper formats while margin guides and a ruler settle.
 * Only runs inside the ToolModal CALC embed.
 */
export function CustomPaperMarginIntroGate({
  active = true,
  children,
}: CustomPaperMarginIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("CustomPaperMarginLanding");
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

    document.documentElement.setAttribute("data-custom-paper-margin-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-custom-paper-margin-intro");
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
        className="cpm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpm-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="cpm-fs__header">
          <h1 id="cpm-fs-title" className="cpm-fs__title">
            <span className="cpm-fs__title-brand">{t("brand")}</span>
            <span className="cpm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cpm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cpm-fs__stage" aria-hidden>
          <div className="cpm-fs__scene">
            <div
              className="cpm-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="cpm-fs__card">
                <div className="cpm-fs__badges">
                  <span className="cpm-fs__badge cpm-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="cpm-fs__arrow" />
                  <span className="cpm-fs__badge cpm-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="cpm-fs__stage-art">
                  <div className="cpm-fs__format-row">
                    <span className="cpm-fs__format cpm-fs__format--a4">{t("formatA4")}</span>
                    <span className="cpm-fs__format cpm-fs__format--letter">{t("formatLetter")}</span>
                  </div>

                  <div className="cpm-fs__page-wrap">
                    <div className="cpm-fs__ruler" />
                    <div className="cpm-fs__page">
                      <span className="cpm-fs__fold" />
                      <span className="cpm-fs__margin cpm-fs__margin--t" />
                      <span className="cpm-fs__margin cpm-fs__margin--r" />
                      <span className="cpm-fs__margin cpm-fs__margin--b" />
                      <span className="cpm-fs__margin cpm-fs__margin--l" />
                      <span className="cpm-fs__content">
                        <span className="cpm-fs__bar" />
                        <span className="cpm-fs__line" />
                        <span className="cpm-fs__line cpm-fs__line--short" />
                        <span className="cpm-fs__line" />
                      </span>
                    </div>
                  </div>
                </div>

                <span className="cpm-fs__ok">
                  <span className="cpm-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="cpm-fs__footer">
          <button type="button" className="cpm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="cpm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
