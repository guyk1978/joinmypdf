"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./html-markdown-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type HtmlMarkdownConverterIntroGateProps = {
  /** When false, children render immediately (non–html-markdown-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for HTML / Markdown Converter.
 * Split panes → bi-directional beam → MD ↔ HTML + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function HtmlMarkdownConverterIntroGate({
  active = true,
  children,
}: HtmlMarkdownConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("HtmlMarkdownConverterLanding");
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

    document.documentElement.setAttribute("data-html-markdown-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-html-markdown-intro");
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
        className="hmc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hmc-fs-title"
      >
        <header className="hmc-fs__header">
          <h1 id="hmc-fs-title" className="hmc-fs__title">
            <span className="hmc-fs__title-brand">{t("brand")}</span>
            <span className="hmc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="hmc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="hmc-fs__stage" aria-hidden>
          <div className="hmc-fs__scene">
            <div className="hmc-fs__workspace animation-workspace">
              <div className="hmc-fs__card">
                <div className="hmc-fs__badges">
                  <span className="hmc-fs__badge hmc-fs__badge--md">{t("mdBadge")}</span>
                  <span className="hmc-fs__swap">{t("swapLabel")}</span>
                  <span className="hmc-fs__badge hmc-fs__badge--html">{t("htmlBadge")}</span>
                </div>

                <div className="hmc-fs__panes">
                  <div className="hmc-fs__pane hmc-fs__pane--md">
                    <p className="hmc-fs__code">
                      <span className="hmc-fs__tok hmc-fs__tok--md"># </span>
                      {t("mdHeading")}
                    </p>
                    <p className="hmc-fs__code">
                      <span className="hmc-fs__tok hmc-fs__tok--md">**</span>
                      {t("mdBold")}
                      <span className="hmc-fs__tok hmc-fs__tok--md">**</span>
                    </p>
                    <p className="hmc-fs__code">
                      <span className="hmc-fs__tok hmc-fs__tok--md">- </span>
                      {t("mdItem")}
                    </p>
                  </div>

                  <div className="hmc-fs__beam" />

                  <div className="hmc-fs__pane hmc-fs__pane--html">
                    <p className="hmc-fs__code">
                      <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;h1&gt;</span>
                      {t("htmlHeading")}
                      <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;/h1&gt;</span>
                    </p>
                    <p className="hmc-fs__code">
                      <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;strong&gt;</span>
                      {t("htmlBold")}
                      <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;/strong&gt;</span>
                    </p>
                    <p className="hmc-fs__code">
                      <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;li&gt;</span>
                      {t("htmlItem")}
                      <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;/li&gt;</span>
                    </p>
                  </div>
                </div>
              </div>

              <span className="hmc-fs__ok">
                <span className="hmc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="hmc-fs__footer">
          <button type="button" className="hmc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="hmc-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
