"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-epub-landing.css";


type PdfToEpubIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-epub tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to EPUB/MOBI Converter Online.
 * A static PDF reflows into an open digital e-reader layout.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToEpubIntroGate({ active = true, children }: PdfToEpubIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-to-epub-intro",
  });
  const t = useTranslations("PdfToEpubLanding");

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
                  <span className="pte-fs__badge pte-fs__badge--pdf">{t("pdfBadge")}</span>
                  <span className="pte-fs__arrow" />
                  <span className="pte-fs__badge pte-fs__badge--ebook">{t("ebookBadge")}</span>
                </div>

                <div className="pte-fs__stage-art">
                  <div className="pte-fs__pdf">
                    <span className="pte-fs__pdf-fold" />
                    <span className="pte-fs__pdf-mark">PDF</span>
                    <span className="pte-fs__pdf-title">{t("docTitle")}</span>
                    <span className="pte-fs__pdf-line" />
                    <span className="pte-fs__pdf-line pte-fs__pdf-line--short" />
                    <span className="pte-fs__pdf-line" />
                    <span className="pte-fs__pdf-line" />
                    <span className="pte-fs__pdf-line pte-fs__pdf-line--mid" />
                  </div>

                  <div className="pte-fs__reader">
                    <div className="pte-fs__bezel">
                      <span className="pte-fs__bezel-dot" />
                      <span className="pte-fs__bezel-label">{t("readerLabel")}</span>
                    </div>
                    <div className="pte-fs__spread">
                      <div className="pte-fs__leaf pte-fs__leaf--left">
                        <span className="pte-fs__leaf-title">{t("chapter")}</span>
                        <span className="pte-fs__leaf-line" />
                        <span className="pte-fs__leaf-line" />
                        <span className="pte-fs__leaf-line pte-fs__leaf-line--short" />
                        <span className="pte-fs__leaf-line" />
                        <span className="pte-fs__leaf-line pte-fs__leaf-line--mid" />
                      </div>
                      <div className="pte-fs__spine" />
                      <div className="pte-fs__leaf pte-fs__leaf--right">
                        <span className="pte-fs__leaf-line" />
                        <span className="pte-fs__leaf-line pte-fs__leaf-line--mid" />
                        <span className="pte-fs__leaf-line" />
                        <span className="pte-fs__leaf-line pte-fs__leaf-line--short" />
                        <span className="pte-fs__leaf-line" />
                        <span className="pte-fs__page-num">{t("pageNum")}</span>
                      </div>
                    </div>
                  </div>

                  <span className="pte-fs__reflow" />
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
