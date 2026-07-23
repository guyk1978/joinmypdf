"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./favicon-code-generator-landing.css";

type IntroPhase = "intro" | "workspace";

type FaviconCodeGeneratorIntroGateProps = {
  /** When false, children render immediately (non–favicon-code-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Favicon Code Generator.
 * Icon card → scan pulse → terminal types HTML/manifest snippets + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function FaviconCodeGeneratorIntroGate({
  active = true,
  children,
}: FaviconCodeGeneratorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FaviconCodeGeneratorLanding");
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

    document.documentElement.setAttribute("data-favicon-code-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-favicon-code-intro");
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
        className="fcg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fcg-fs-title"
      >
        <header className="fcg-fs__header">
          <h1 id="fcg-fs-title" className="fcg-fs__title">
            <span className="fcg-fs__title-brand">{t("brand")}</span>
            <span className="fcg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="fcg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="fcg-fs__stage" aria-hidden>
          <div className="fcg-fs__scene">
            <div className="fcg-fs__workspace animation-workspace">
              <div className="fcg-fs__pair">
                <div className="fcg-fs__icon-card">
                  <div className="fcg-fs__icon">
                    <span className="fcg-fs__icon-glyph" />
                  </div>
                  <span className="fcg-fs__icon-label">{t("iconLabel")}</span>
                  <div className="fcg-fs__scan" />
                </div>

                <div className="fcg-fs__terminal">
                  <div className="fcg-fs__term-bar">
                    <span />
                    <span />
                    <span />
                    <em>{t("termTitle")}</em>
                  </div>
                  <div className="fcg-fs__term-body">
                    <p className="fcg-fs__line fcg-fs__line--1">
                      <span className="fcg-fs__tok fcg-fs__tok--tag">&lt;link</span>{" "}
                      <span className="fcg-fs__tok fcg-fs__tok--attr">rel</span>=
                      <span className="fcg-fs__tok fcg-fs__tok--str">&quot;icon&quot;</span>
                    </p>
                    <p className="fcg-fs__line fcg-fs__line--2">
                      <span className="fcg-fs__tok fcg-fs__tok--attr">href</span>=
                      <span className="fcg-fs__tok fcg-fs__tok--str">&quot;/favicon.ico&quot;</span>
                      <span className="fcg-fs__tok fcg-fs__tok--tag">&gt;</span>
                    </p>
                    <p className="fcg-fs__line fcg-fs__line--3">
                      <span className="fcg-fs__tok fcg-fs__tok--tag">&lt;link</span>{" "}
                      <span className="fcg-fs__tok fcg-fs__tok--attr">rel</span>=
                      <span className="fcg-fs__tok fcg-fs__tok--str">&quot;manifest&quot;</span>
                    </p>
                    <p className="fcg-fs__line fcg-fs__line--4">
                      <span className="fcg-fs__tok fcg-fs__tok--attr">href</span>=
                      <span className="fcg-fs__tok fcg-fs__tok--str">&quot;/site.webmanifest&quot;</span>
                      <span className="fcg-fs__tok fcg-fs__tok--tag">&gt;</span>
                      <span className="fcg-fs__caret" />
                    </p>
                  </div>
                </div>
              </div>

              <span className="fcg-fs__ok">
                <span className="fcg-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="fcg-fs__footer">
          <button type="button" className="fcg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="fcg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
