"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./pdf-to-text-landing.css";

type IntroPhase = "intro" | "workspace";

type PdfToTextIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-text tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to Text.
 * PDF text blocks → OCR laser → characters flow into .txt editor with checkmark.
 * Only runs inside the ToolModal CALC embed.
 */
export function PdfToTextIntroGate({
  active = true,
  children,
}: PdfToTextIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PdfToTextLanding");
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

    document.documentElement.setAttribute("data-pdf-text-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-text-intro");
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
        className="p2t-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2t-fs-title"
      >
        <header className="p2t-fs__header">
          <h1 id="p2t-fs-title" className="p2t-fs__title">
            <span className="p2t-fs__title-brand">{t("brand")}</span>
            <span className="p2t-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="p2t-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="p2t-fs__stage" aria-hidden>
          <div className="p2t-fs__scene">
            <div className="p2t-fs__workspace animation-workspace">
              <div className="p2t-fs__chars">
                <span>A</span>
                <span>b</span>
                <span>1</span>
                <span>T</span>
                <span>x</span>
                <span>9</span>
                <span>e</span>
                <span>R</span>
              </div>

              <div className="p2t-fs__pdf">
                <div className="p2t-fs__pdf-sheet">
                  <span className="p2t-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="p2t-fs__blocks">
                    <span /><span /><span /><span /><span /><span />
                  </div>
                  <div className="p2t-fs__laser" />
                </div>
                <span className="p2t-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="p2t-fs__editor">
                <div className="p2t-fs__editor-card">
                  <div className="p2t-fs__editor-bar">
                    <span className="p2t-fs__txt">{t("txtBadge")}</span>
                    <span className="p2t-fs__ok">
                      <span className="p2t-fs__check" />
                      {t("success")}
                    </span>
                  </div>
                  <div className="p2t-fs__typed">
                    <span className="p2t-fs__line p2t-fs__line--1">{t("line1")}</span>
                    <span className="p2t-fs__line p2t-fs__line--2">{t("line2")}</span>
                    <span className="p2t-fs__line p2t-fs__line--3">{t("line3")}</span>
                    <span className="p2t-fs__caret" />
                  </div>
                </div>
                <span className="p2t-fs__txt-name">{t("txtName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p2t-fs__footer">
          <button type="button" className="p2t-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="p2t-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
