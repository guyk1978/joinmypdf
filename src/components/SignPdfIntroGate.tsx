"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./sign-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type SignPdfIntroGateProps = {
  /** When false, children render immediately (non–sign-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Sign PDF Online.
 * A digital pen glides along a signature line and draws a cursive mark.
 * Only runs inside the ToolModal CALC embed.
 */
export function SignPdfIntroGate({ active = true, children }: SignPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("SignPdfLanding");
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

    document.documentElement.setAttribute("data-sign-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-sign-pdf-intro");
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
        className="sgn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sgn-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="sgn-fs__header">
          <h1 id="sgn-fs-title" className="sgn-fs__title">
            <span className="sgn-fs__title-brand">{t("brand")}</span>
            <span className="sgn-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="sgn-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="sgn-fs__stage" aria-hidden>
          <div className="sgn-fs__scene">
            <div
              className="sgn-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="sgn-fs__card">
                <div className="sgn-fs__badges">
                  <span className="sgn-fs__badge sgn-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="sgn-fs__arrow" />
                  <span className="sgn-fs__badge sgn-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="sgn-fs__stage-art">
                  <div className="sgn-fs__doc">
                    <span className="sgn-fs__fold" />
                    <span className="sgn-fs__heading" />
                    <span className="sgn-fs__line" />
                    <span className="sgn-fs__line sgn-fs__line--short" />
                    <span className="sgn-fs__line" />

                    <div className="sgn-fs__sign-area">
                      <span className="sgn-fs__sign-label">{t("signLine")}</span>
                      <span className="sgn-fs__sign-rule" />
                      <svg
                        className="sgn-fs__sig-svg"
                        viewBox="0 0 160 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          className="sgn-fs__sig-path"
                          d="M8 32 C 22 10, 36 44, 48 26 S 72 8, 84 28 S 108 42, 122 18 S 142 12, 152 28"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="sgn-fs__pen" />
                    </div>
                  </div>
                </div>

                <span className="sgn-fs__ok">
                  <span className="sgn-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sgn-fs__footer">
          <button type="button" className="sgn-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="sgn-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
