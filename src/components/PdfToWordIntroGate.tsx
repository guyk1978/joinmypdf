"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-word-landing.css";


type PdfToWordIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-word tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to Word.
 * PDF layout → structure scan → editable .docx card with Word badge + cursor.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToWordIntroGate({
  active = true,
  children,
}: PdfToWordIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-word-intro",
  });
  const t = useTranslations("PdfToWordLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="p2w-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2w-fs-title"
      >
        <header className="p2w-fs__header">
          <h1 id="p2w-fs-title" className="p2w-fs__title">
            <span className="p2w-fs__title-brand">{t("brand")}</span>
            <span className="p2w-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="p2w-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="p2w-fs__stage" aria-hidden>
          <div className="p2w-fs__scene">
            <div className="p2w-fs__workspace animation-workspace">
              <div className="p2w-fs__pdf">
                <div className="p2w-fs__pdf-sheet">
                  <span className="p2w-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="p2w-fs__heading" />
                  <div className="p2w-fs__para">
                    <span /><span /><span />
                  </div>
                  <div className="p2w-fs__para p2w-fs__para--sm">
                    <span /><span />
                  </div>
                  <div className="p2w-fs__box p2w-fs__box--h" />
                  <div className="p2w-fs__box p2w-fs__box--p1" />
                  <div className="p2w-fs__box p2w-fs__box--p2" />
                  <div className="p2w-fs__scan" />
                </div>
                <span className="p2w-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="p2w-fs__word">
                <div className="p2w-fs__word-sheet">
                  <span className="p2w-fs__docx">{t("docxBadge")}</span>
                  <div className="p2w-fs__w-heading">
                    <span className="p2w-fs__label">{t("heading")}</span>
                  </div>
                  <div className="p2w-fs__w-lines">
                    <span /><span /><span /><span />
                  </div>
                  <span className="p2w-fs__cursor" />
                  <span className="p2w-fs__editable">{t("editable")}</span>
                </div>
                <span className="p2w-fs__word-name">{t("wordName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p2w-fs__footer">
          <button type="button" className="p2w-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="p2w-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
