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
 * Glowing digital pen draws a signature → Signed & Verified stamp.
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
        className="sp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="sp-fs__header">
          <h1 id="sp-fs-title" className="sp-fs__title">
            <span className="sp-fs__title-brand">{t("brand")}</span>
            <span className="sp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="sp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="sp-fs__stage" aria-hidden>
          <div className="sp-fs__scene">
            <div className="sp-fs__workspace animation-workspace">
              <div className="sp-fs__card">
                <div className="sp-fs__badges">
                  <span className="sp-fs__badge sp-fs__badge--draw">{t("drawBadge")}</span>
                  <span className="sp-fs__badge sp-fs__badge--signed">{t("signedBadge")}</span>
                </div>

                <div className="sp-fs__preview">
                  <div className="sp-fs__doc">
                    <span className="sp-fs__line sp-fs__line--title" />
                    <span className="sp-fs__line" />
                    <span className="sp-fs__line sp-fs__line--mid" />
                    <span className="sp-fs__line sp-fs__line--short" />
                    <span className="sp-fs__line" />

                    <div className="sp-fs__sign-area">
                      <span className="sp-fs__sign-label">{t("signLine")}</span>
                      <span className="sp-fs__sign-rule" />
                      <svg
                        className="sp-fs__sig-svg"
                        viewBox="0 0 160 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className="sp-fs__sig-path"
                          d="M8 32 C 22 10, 36 44, 48 26 S 72 8, 84 28 S 108 42, 122 18 S 142 12, 152 28"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="sp-fs__pen" />
                    </div>
                  </div>

                  <span className="sp-fs__stamp">
                    <span className="sp-fs__stamp-icon" />
                    {t("verifiedBadge")}
                  </span>
                </div>
              </div>

              <span className="sp-fs__ok">
                <span className="sp-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="sp-fs__footer">
          <button type="button" className="sp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="sp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
