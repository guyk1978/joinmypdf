"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./pdf-metadata-editor-landing.css";

type IntroPhase = "intro" | "workspace";

type PdfMetadataEditorIntroGateProps = {
  /** When false, children render immediately (non–pdf-metadata-editor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF Metadata Editor Online.
 * A properties panel types Title, Author, and Keywords next to a PDF card.
 * Only runs inside the ToolModal CALC embed.
 */
export function PdfMetadataEditorIntroGate({
  active = true,
  children,
}: PdfMetadataEditorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PdfMetadataEditorLanding");
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

    document.documentElement.setAttribute("data-pdf-metadata-editor-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-pdf-metadata-editor-intro");
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
        className="pme-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pme-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="pme-fs__header">
          <h1 id="pme-fs-title" className="pme-fs__title">
            <span className="pme-fs__title-brand">{t("brand")}</span>
            <span className="pme-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="pme-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="pme-fs__stage" aria-hidden>
          <div className="pme-fs__scene">
            <div
              className="pme-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="pme-fs__card">
                <div className="pme-fs__badges">
                  <span className="pme-fs__badge pme-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="pme-fs__arrow" />
                  <span className="pme-fs__badge pme-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="pme-fs__stage-art">
                  <div className="pme-fs__doc">
                    <span className="pme-fs__fold" />
                    <span className="pme-fs__mark">PDF</span>
                    <span className="pme-fs__bar" />
                    <span className="pme-fs__line" />
                    <span className="pme-fs__line pme-fs__line--short" />
                    <span className="pme-fs__line" />
                  </div>

                  <div className="pme-fs__panel">
                    <span className="pme-fs__panel-head">{t("properties")}</span>
                    <div className="pme-fs__field pme-fs__field--1">
                      <span className="pme-fs__field-label">{t("titleLabel")}</span>
                      <span className="pme-fs__field-value">
                        <span className="pme-fs__typed pme-fs__typed--title">{t("titleValue")}</span>
                        <span className="pme-fs__caret pme-fs__caret--1" />
                      </span>
                    </div>
                    <div className="pme-fs__field pme-fs__field--2">
                      <span className="pme-fs__field-label">{t("authorLabel")}</span>
                      <span className="pme-fs__field-value">
                        <span className="pme-fs__typed pme-fs__typed--author">{t("authorValue")}</span>
                        <span className="pme-fs__caret pme-fs__caret--2" />
                      </span>
                    </div>
                    <div className="pme-fs__field pme-fs__field--3">
                      <span className="pme-fs__field-label">{t("keywordsLabel")}</span>
                      <span className="pme-fs__field-value">
                        <span className="pme-fs__typed pme-fs__typed--keywords">{t("keywordsValue")}</span>
                        <span className="pme-fs__caret pme-fs__caret--3" />
                      </span>
                    </div>
                  </div>
                </div>

                <span className="pme-fs__ok">
                  <span className="pme-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pme-fs__footer">
          <button type="button" className="pme-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="pme-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
