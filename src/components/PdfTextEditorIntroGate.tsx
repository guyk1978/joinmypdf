"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./pdf-text-editor-landing.css";

type IntroPhase = "intro" | "workspace";

type PdfTextEditorIntroGateProps = {
  /** When false, children render immediately (non–pdf-text-editor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Edit PDF Text Online.
 * An editable outline selects, deletes, and retypes text on a PDF page.
 * Only runs inside the ToolModal CALC embed.
 */
export function PdfTextEditorIntroGate({
  active = true,
  children,
}: PdfTextEditorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PdfTextEditorLanding");
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

    document.documentElement.setAttribute("data-pdf-text-editor-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-text-editor-intro");
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
        className="pte-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pte-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="pte-fs__header">
          <h1 id="pte-fs-title" className="pte-fs__title">
            <span className="pte-fs__title-brand">{t("brand")}</span>
            <span className="pte-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="pte-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="pte-fs__stage" aria-hidden>
          <div className="pte-fs__scene">
            <div
              className="pte-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="pte-fs__card">
                <div className="pte-fs__badges">
                  <span className="pte-fs__badge pte-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="pte-fs__arrow" />
                  <span className="pte-fs__badge pte-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="pte-fs__stage-art">
                  <div className="pte-fs__doc">
                    <span className="pte-fs__fold" />
                    <span className="pte-fs__heading" />
                    <span className="pte-fs__line" />
                    <span className="pte-fs__edit-box">
                      <span className="pte-fs__handle pte-fs__handle--tl" />
                      <span className="pte-fs__handle pte-fs__handle--tr" />
                      <span className="pte-fs__handle pte-fs__handle--bl" />
                      <span className="pte-fs__handle pte-fs__handle--br" />
                      <span className="pte-fs__old">{t("oldWord")}</span>
                      <span className="pte-fs__typed">
                        <span className="pte-fs__typed-text">{t("newWord")}</span>
                        <span className="pte-fs__caret" />
                      </span>
                    </span>
                    <span className="pte-fs__line pte-fs__line--short" />
                    <span className="pte-fs__line" />
                  </div>
                </div>

                <span className="pte-fs__ok">
                  <span className="pte-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pte-fs__footer">
          <button type="button" className="pte-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="pte-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
