"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./case-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type CaseConverterIntroGateProps = {
  /** When false, children render immediately (non–case-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Case Converter.
 * Editor card → case selector cycles UPPER / lower / Title + Aa badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function CaseConverterIntroGate({
  active = true,
  children,
}: CaseConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("CaseConverterLanding");
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

    document.documentElement.setAttribute("data-case-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-case-converter-intro");
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
        className="cc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-fs-title"
      >
        <header className="cc-fs__header">
          <h1 id="cc-fs-title" className="cc-fs__title">
            <span className="cc-fs__title-brand">{t("brand")}</span>
            <span className="cc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cc-fs__stage" aria-hidden>
          <div className="cc-fs__scene">
            <div className="cc-fs__workspace animation-workspace">
              <div className="cc-fs__card">
                <div className="cc-fs__toolbar">
                  <span className="cc-fs__aa">{t("aaBadge")}</span>
                  <div className="cc-fs__modes">
                    <span className="cc-fs__mode cc-fs__mode--upper">{t("upperMode")}</span>
                    <span className="cc-fs__mode cc-fs__mode--lower">{t("lowerMode")}</span>
                    <span className="cc-fs__mode cc-fs__mode--title">{t("titleMode")}</span>
                  </div>
                </div>

                <div className="cc-fs__editor">
                  <p className="cc-fs__line cc-fs__line--upper">{t("sampleUpper")}</p>
                  <p className="cc-fs__line cc-fs__line--lower">{t("sampleLower")}</p>
                  <p className="cc-fs__line cc-fs__line--title">{t("sampleTitle")}</p>
                </div>
              </div>

              <span className="cc-fs__ok">
                <span className="cc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="cc-fs__footer">
          <button type="button" className="cc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="cc-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
