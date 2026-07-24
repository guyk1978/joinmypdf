"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
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
 * Live MD editor → bidirectional MD ↔ HTML node + laser → compiled HTML tags.
 * Shows before the converter workspace (embed modal and dedicated tool page).
 */
export function HtmlMarkdownConverterIntroGate({
  active = true,
  children,
}: HtmlMarkdownConverterIntroGateProps) {
  const introActive = active;
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
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
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
                <div className="hmc-fs__pipeline">
                  <div className="hmc-fs__pane hmc-fs__pane--md">
                    <div className="hmc-fs__chrome">
                      <span className="hmc-fs__dot" />
                      <span className="hmc-fs__dot" />
                      <span className="hmc-fs__dot" />
                      <span className="hmc-fs__tag">{t("mdBadge")}</span>
                    </div>
                    <div className="hmc-fs__editor">
                      <p className="hmc-fs__line hmc-fs__line--1">
                        <span className="hmc-fs__tok hmc-fs__tok--md"># </span>
                        <span className="hmc-fs__text">{t("mdHeading")}</span>
                      </p>
                      <p className="hmc-fs__line hmc-fs__line--2">
                        <span className="hmc-fs__tok hmc-fs__tok--md">**</span>
                        <span className="hmc-fs__text">{t("mdBold")}</span>
                        <span className="hmc-fs__tok hmc-fs__tok--md">**</span>
                      </p>
                      <p className="hmc-fs__line hmc-fs__line--3">
                        <span className="hmc-fs__tok hmc-fs__tok--md">- </span>
                        <span className="hmc-fs__text">{t("mdItem")}</span>
                      </p>
                      <span className="hmc-fs__caret" />
                    </div>
                    <span className="hmc-fs__laser" />
                  </div>

                  <div className="hmc-fs__engine">
                    <span className="hmc-fs__flow hmc-fs__flow--fwd" />
                    <span className="hmc-fs__flow hmc-fs__flow--rev" />
                    <span className="hmc-fs__core">{t("swapLabel")}</span>
                    <span className="hmc-fs__engine-badge">{t("engineBadge")}</span>
                  </div>

                  <div className="hmc-fs__pane hmc-fs__pane--html">
                    <div className="hmc-fs__chrome">
                      <span className="hmc-fs__dot" />
                      <span className="hmc-fs__dot" />
                      <span className="hmc-fs__dot" />
                      <span className="hmc-fs__tag hmc-fs__tag--html">{t("htmlBadge")}</span>
                    </div>
                    <div className="hmc-fs__editor hmc-fs__editor--html">
                      <p className="hmc-fs__line hmc-fs__line--1">
                        <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;h1&gt;</span>
                        <span className="hmc-fs__text">{t("htmlHeading")}</span>
                        <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;/h1&gt;</span>
                      </p>
                      <p className="hmc-fs__line hmc-fs__line--2">
                        <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;strong&gt;</span>
                        <span className="hmc-fs__text">{t("htmlBold")}</span>
                        <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;/strong&gt;</span>
                      </p>
                      <p className="hmc-fs__line hmc-fs__line--3">
                        <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;li&gt;</span>
                        <span className="hmc-fs__text">{t("htmlItem")}</span>
                        <span className="hmc-fs__tok hmc-fs__tok--tag">&lt;/li&gt;</span>
                      </p>
                    </div>
                    <span className="hmc-fs__laser hmc-fs__laser--html" />
                  </div>
                </div>

                <span className="hmc-fs__particle hmc-fs__particle--1" />
                <span className="hmc-fs__particle hmc-fs__particle--2" />
                <span className="hmc-fs__particle hmc-fs__particle--3" />
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
      return (
        <div
          className="hmc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
