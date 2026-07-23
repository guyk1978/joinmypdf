"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./html-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type HtmlToPdfIntroGateProps = {
  /** When false, children render immediately (non–html-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free HTML to PDF Converter Online.
 * HTML snippet blocks compile into a formatted PDF preview with format badges.
 * Only runs inside the ToolModal CALC embed.
 */
export function HtmlToPdfIntroGate({ active = true, children }: HtmlToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("HtmlToPdfLanding");
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

    document.documentElement.setAttribute("data-html-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-html-to-pdf-intro");
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
        className="htp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="htp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="htp-fs__header">
          <h1 id="htp-fs-title" className="htp-fs__title">
            <span className="htp-fs__title-brand">{t("brand")}</span>
            <span className="htp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="htp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="htp-fs__stage" aria-hidden>
          <div className="htp-fs__scene">
            <div className="htp-fs__workspace animation-workspace">
              <div className="htp-fs__card">
                <div className="htp-fs__badges">
                  <span className="htp-fs__badge htp-fs__badge--html">{t("htmlBadge")}</span>
                  <span className="htp-fs__arrow" />
                  <span className="htp-fs__badge htp-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="htp-fs__stage-art">
                  <div className="htp-fs__code">
                    <span className="htp-fs__code-line">
                      <span className="htp-fs__tok htp-fs__tok--tag">&lt;html&gt;</span>
                    </span>
                    <span className="htp-fs__code-line htp-fs__code-line--indent">
                      <span className="htp-fs__tok htp-fs__tok--tag">&lt;h1&gt;</span>
                      <span className="htp-fs__tok htp-fs__tok--text">{t("codeTitle")}</span>
                      <span className="htp-fs__tok htp-fs__tok--tag">&lt;/h1&gt;</span>
                    </span>
                    <span className="htp-fs__code-line htp-fs__code-line--indent">
                      <span className="htp-fs__tok htp-fs__tok--tag">&lt;p&gt;</span>
                      <span className="htp-fs__tok htp-fs__tok--text">{t("codeBody")}</span>
                      <span className="htp-fs__tok htp-fs__tok--tag">&lt;/p&gt;</span>
                    </span>
                    <span className="htp-fs__code-line">
                      <span className="htp-fs__tok htp-fs__tok--tag">&lt;/html&gt;</span>
                    </span>
                  </div>

                  <div className="htp-fs__pdf">
                    <span className="htp-fs__pdf-fold" />
                    <span className="htp-fs__pdf-title">{t("codeTitle")}</span>
                    <span className="htp-fs__pdf-line" />
                    <span className="htp-fs__pdf-line htp-fs__pdf-line--short" />
                    <span className="htp-fs__pdf-line" />
                    <span className="htp-fs__pdf-block" />
                  </div>

                  <span className="htp-fs__beam" />
                </div>

                <span className="htp-fs__ok">
                  <span className="htp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="htp-fs__footer">
          <button type="button" className="htp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="htp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
