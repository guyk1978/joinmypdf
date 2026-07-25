"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-jpg-landing.css";


type PdfToJpgIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-jpg tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PDF to JPG.
 * PDF card → rendering beam → pages detach into high-res .jpg cards.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToJpgIntroGate({
  active = true,
  children,
}: PdfToJpgIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-to-jpg-intro",
  });
  const t = useTranslations("PdfToJpgLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="p2j-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2j-fs-title"
      >
        <header className="p2j-fs__header">
          <h1 id="p2j-fs-title" className="p2j-fs__title">
            <span className="p2j-fs__title-brand">{t("brand")}</span>
            <span className="p2j-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="p2j-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="p2j-fs__stage" aria-hidden>
          <div className="p2j-fs__scene">
            <div className="p2j-fs__workspace animation-workspace">
              <div className="p2j-fs__particles">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="p2j-fs__pdf">
                <div className="p2j-fs__pdf-sheet">
                  <span className="p2j-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="p2j-fs__page-stack">
                    <span className="p2j-fs__leaf p2j-fs__leaf--1" />
                    <span className="p2j-fs__leaf p2j-fs__leaf--2" />
                    <span className="p2j-fs__leaf p2j-fs__leaf--3" />
                  </div>
                  <div className="p2j-fs__beam" />
                </div>
                <span className="p2j-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="p2j-fs__exports">
                <div className="p2j-fs__card p2j-fs__card--a">
                  <div className="p2j-fs__thumb p2j-fs__thumb--a" />
                  <span className="p2j-fs__fmt">{t("jpgBadge")}</span>
                </div>
                <div className="p2j-fs__card p2j-fs__card--b">
                  <div className="p2j-fs__thumb p2j-fs__thumb--b" />
                  <span className="p2j-fs__fmt">{t("jpgBadge")}</span>
                </div>
                <div className="p2j-fs__card p2j-fs__card--c">
                  <div className="p2j-fs__thumb p2j-fs__thumb--c" />
                  <span className="p2j-fs__fmt">{t("jpgBadge")}</span>
                </div>
                <span className="p2j-fs__ok">
                  <span className="p2j-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p2j-fs__footer">
          <button type="button" className="p2j-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="p2j-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
