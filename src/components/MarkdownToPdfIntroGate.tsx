"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./markdown-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type MarkdownToPdfIntroGateProps = {
  /** When false, children render immediately (non–markdown-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Markdown to PDF Converter Online.
 * Raw markdown syntax compiles into a polished PDF preview with .md → .pdf badges.
 * Only runs inside the ToolModal CALC embed.
 */
export function MarkdownToPdfIntroGate({ active = true, children }: MarkdownToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("MarkdownToPdfLanding");
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

    document.documentElement.setAttribute("data-markdown-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-markdown-to-pdf-intro");
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
        className="mdp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="mdp-fs__header">
          <h1 id="mdp-fs-title" className="mdp-fs__title">
            <span className="mdp-fs__title-brand">{t("brand")}</span>
            <span className="mdp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="mdp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="mdp-fs__stage" aria-hidden>
          <div className="mdp-fs__scene">
            <div className="mdp-fs__workspace animation-workspace">
              <div className="mdp-fs__card">
                <div className="mdp-fs__badges">
                  <span className="mdp-fs__badge mdp-fs__badge--md">{t("mdBadge")}</span>
                  <span className="mdp-fs__arrow" />
                  <span className="mdp-fs__badge mdp-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="mdp-fs__stage-art">
                  <div className="mdp-fs__md">
                    <span className="mdp-fs__md-line">
                      <span className="mdp-fs__tok mdp-fs__tok--hash">#</span>{" "}
                      <span className="mdp-fs__tok mdp-fs__tok--text">{t("mdTitle")}</span>
                    </span>
                    <span className="mdp-fs__md-line">
                      <span className="mdp-fs__tok mdp-fs__tok--hash">##</span>{" "}
                      <span className="mdp-fs__tok mdp-fs__tok--text">{t("mdHeading")}</span>
                    </span>
                    <span className="mdp-fs__md-line">
                      <span className="mdp-fs__tok mdp-fs__tok--list">-</span>{" "}
                      <span className="mdp-fs__tok mdp-fs__tok--text">{t("mdItem")}</span>
                    </span>
                    <span className="mdp-fs__md-line">
                      <span className="mdp-fs__tok mdp-fs__tok--bold">**{t("mdBold")}**</span>
                    </span>
                  </div>

                  <div className="mdp-fs__pdf">
                    <span className="mdp-fs__pdf-fold" />
                    <span className="mdp-fs__pdf-h1">{t("mdTitle")}</span>
                    <span className="mdp-fs__pdf-h2">{t("mdHeading")}</span>
                    <span className="mdp-fs__pdf-bullet">{t("mdItem")}</span>
                    <span className="mdp-fs__pdf-line" />
                    <span className="mdp-fs__pdf-line mdp-fs__pdf-line--short" />
                  </div>

                  <span className="mdp-fs__beam" />
                </div>

                <span className="mdp-fs__ok">
                  <span className="mdp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mdp-fs__footer">
          <button type="button" className="mdp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="mdp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
