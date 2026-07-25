"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-a-converter-landing.css";


type PdfAConverterIntroGateProps = {
  /** When false, children render immediately (non–pdf-a-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF/A Converter Online.
 * A standard PDF receives a glowing archival seal and ISO PDF/A-1b badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfAConverterIntroGate({
  active = true,
  children,
}: PdfAConverterIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-a-converter-intro",
  });
  const t = useTranslations("PdfAConverterLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="pda-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pda-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="pda-fs__header">
          <h1 id="pda-fs-title" className="pda-fs__title">
            <span className="pda-fs__title-brand">{t("brand")}</span>
            <span className="pda-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="pda-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="pda-fs__stage" aria-hidden>
          <div className="pda-fs__scene">
            <div
              className="pda-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="pda-fs__card">
                <div className="pda-fs__badges">
                  <span className="pda-fs__badge pda-fs__badge--pdf">{t("pdfBadge")}</span>
                  <span className="pda-fs__arrow" />
                  <span className="pda-fs__badge pda-fs__badge--iso">{t("isoBadge")}</span>
                </div>

                <div className="pda-fs__stage-art">
                  <div className="pda-fs__doc">
                    <span className="pda-fs__doc-fold" />
                    <span className="pda-fs__doc-mark">PDF</span>
                    <span className="pda-fs__doc-title">{t("docTitle")}</span>
                    <span className="pda-fs__doc-line" />
                    <span className="pda-fs__doc-line pda-fs__doc-line--short" />
                    <span className="pda-fs__doc-line" />
                    <span className="pda-fs__doc-block" />

                    <div className="pda-fs__seal" aria-hidden>
                      <span className="pda-fs__seal-ring" />
                      <span className="pda-fs__seal-ring pda-fs__seal-ring--inner" />
                      <span className="pda-fs__seal-core">{t("sealLabel")}</span>
                    </div>
                  </div>

                  <div className="pda-fs__tags">
                    <span className="pda-fs__tag pda-fs__tag--a">{t("tagXmp")}</span>
                    <span className="pda-fs__tag pda-fs__tag--b">{t("tagFonts")}</span>
                    <span className="pda-fs__tag pda-fs__tag--c">{t("tagArchive")}</span>
                  </div>

                  <span className="pda-fs__scan" />
                </div>

                <span className="pda-fs__ok">
                  <span className="pda-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pda-fs__footer">
          <button type="button" className="pda-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="pda-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
