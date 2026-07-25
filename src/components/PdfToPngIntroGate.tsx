"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-to-png-landing.css";


type PdfToPngIntroGateProps = {
  /** When false, children render immediately (non–pdf-to-png tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PDF to PNG.
 * PDF card → rendering beam → pages detach into sharp .png cards.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfToPngIntroGate({
  active = true,
  children,
}: PdfToPngIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-to-png-intro",
  });
  const t = useTranslations("PdfToPngLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="p2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2p-fs-title"
      >
        <header className="p2p-fs__header">
          <h1 id="p2p-fs-title" className="p2p-fs__title">
            <span className="p2p-fs__title-brand">{t("brand")}</span>
            <span className="p2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="p2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="p2p-fs__stage" aria-hidden>
          <div className="p2p-fs__scene">
            <div className="p2p-fs__workspace animation-workspace">
              <div className="p2p-fs__particles">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="p2p-fs__pdf">
                <div className="p2p-fs__pdf-sheet">
                  <span className="p2p-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="p2p-fs__page-stack">
                    <span className="p2p-fs__leaf p2p-fs__leaf--1" />
                    <span className="p2p-fs__leaf p2p-fs__leaf--2" />
                    <span className="p2p-fs__leaf p2p-fs__leaf--3" />
                  </div>
                  <div className="p2p-fs__beam" />
                </div>
                <span className="p2p-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="p2p-fs__exports">
                <div className="p2p-fs__card p2p-fs__card--a">
                  <div className="p2p-fs__thumb p2p-fs__thumb--a" />
                  <span className="p2p-fs__fmt">{t("pngBadge")}</span>
                </div>
                <div className="p2p-fs__card p2p-fs__card--b">
                  <div className="p2p-fs__thumb p2p-fs__thumb--b" />
                  <span className="p2p-fs__fmt">{t("pngBadge")}</span>
                </div>
                <div className="p2p-fs__card p2p-fs__card--c">
                  <div className="p2p-fs__thumb p2p-fs__thumb--c" />
                  <span className="p2p-fs__fmt">{t("pngBadge")}</span>
                </div>
                <span className="p2p-fs__ok">
                  <span className="p2p-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p2p-fs__footer">
          <button type="button" className="p2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="p2p-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
