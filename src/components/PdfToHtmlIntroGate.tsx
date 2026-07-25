"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-html-landing.css";


type PdfToHtmlIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-html tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF to HTML Converter Online.
 * A static PDF decomposes into HTML5 tags + a browser preview pane.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToHtmlIntroGate({ active = true, children }: PdfToHtmlIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-to-html-intro",
  });
  const t = useTranslations("PdfToHtmlLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="pth-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pth-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="pth-fs__header">
          <h1 id="pth-fs-title" className="pth-fs__title">
            <span className="pth-fs__title-brand">{t("brand")}</span>
            <span className="pth-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="pth-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="pth-fs__stage" aria-hidden>
          <div className="pth-fs__scene">
            <div
              className="pth-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="pth-fs__card">
                <div className="pth-fs__badges">
                  <span className="pth-fs__badge pth-fs__badge--pdf">{t("pdfBadge")}</span>
                  <span className="pth-fs__arrow" />
                  <span className="pth-fs__badge pth-fs__badge--html">{t("htmlBadge")}</span>
                </div>

                <div className="pth-fs__stage-art">
                  <div className="pth-fs__pdf">
                    <span className="pth-fs__pdf-fold" />
                    <span className="pth-fs__pdf-mark">PDF</span>
                    <span className="pth-fs__pdf-title">{t("docTitle")}</span>
                    <span className="pth-fs__pdf-line" />
                    <span className="pth-fs__pdf-line pth-fs__pdf-line--short" />
                    <span className="pth-fs__pdf-line" />
                    <span className="pth-fs__pdf-block" />
                  </div>

                  <div className="pth-fs__out">
                    <div className="pth-fs__code">
                      <span className="pth-fs__code-line">
                        <span className="pth-fs__tok pth-fs__tok--tag">&lt;article&gt;</span>
                      </span>
                      <span className="pth-fs__code-line pth-fs__code-line--indent">
                        <span className="pth-fs__tok pth-fs__tok--tag">&lt;h1&gt;</span>
                        <span className="pth-fs__tok pth-fs__tok--text">{t("codeTitle")}</span>
                        <span className="pth-fs__tok pth-fs__tok--tag">&lt;/h1&gt;</span>
                      </span>
                      <span className="pth-fs__code-line pth-fs__code-line--indent">
                        <span className="pth-fs__tok pth-fs__tok--tag">&lt;p&gt;</span>
                        <span className="pth-fs__tok pth-fs__tok--text">{t("codeBody")}</span>
                        <span className="pth-fs__tok pth-fs__tok--tag">&lt;/p&gt;</span>
                      </span>
                      <span className="pth-fs__code-line">
                        <span className="pth-fs__tok pth-fs__tok--tag">&lt;/article&gt;</span>
                      </span>
                    </div>

                    <div className="pth-fs__browser">
                      <div className="pth-fs__chrome">
                        <span className="pth-fs__dot pth-fs__dot--r" />
                        <span className="pth-fs__dot pth-fs__dot--y" />
                        <span className="pth-fs__dot pth-fs__dot--g" />
                        <span className="pth-fs__url">{t("urlBar")}</span>
                      </div>
                      <div className="pth-fs__preview">
                        <span className="pth-fs__preview-h">{t("codeTitle")}</span>
                        <span className="pth-fs__preview-p">{t("codeBody")}</span>
                        <span className="pth-fs__preview-bar" />
                      </div>
                    </div>
                  </div>

                  <span className="pth-fs__beam" />
                </div>

                <span className="pth-fs__ok">
                  <span className="pth-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pth-fs__footer">
          <button type="button" className="pth-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="pth-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
