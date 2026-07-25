"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./heic-to-pdf-landing.css";


type HeicToPdfIntroGateProps = {
  /** When false, children render immediately (non–heic-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert HEIC to PDF Online.
 * Mobile HEIC photo morphs into a structured PDF document with format badges.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function HeicToPdfIntroGate({ active = true, children }: HeicToPdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-heic-to-pdf-intro",
  });
  const t = useTranslations("HeicToPdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="h2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="h2p-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="h2p-fs__header">
          <h1 id="h2p-fs-title" className="h2p-fs__title">
            <span className="h2p-fs__title-brand">{t("brand")}</span>
            <span className="h2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="h2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="h2p-fs__stage" aria-hidden>
          <div className="h2p-fs__scene">
            <div className="h2p-fs__workspace animation-workspace">
              <div className="h2p-fs__card">
                <div className="h2p-fs__badges">
                  <span className="h2p-fs__badge h2p-fs__badge--heic">{t("heicBadge")}</span>
                  <span className="h2p-fs__arrow" />
                  <span className="h2p-fs__badge h2p-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="h2p-fs__stage-art">
                  <div className="h2p-fs__photo">
                    <span className="h2p-fs__sky" />
                    <span className="h2p-fs__hill" />
                    <span className="h2p-fs__sun" />
                    <span className="h2p-fs__fname h2p-fs__fname--heic">{t("heicName")}</span>
                  </div>

                  <div className="h2p-fs__pdf">
                    <span className="h2p-fs__pdf-fold" />
                    <span className="h2p-fs__pdf-line" />
                    <span className="h2p-fs__pdf-line h2p-fs__pdf-line--short" />
                    <span className="h2p-fs__pdf-line" />
                    <span className="h2p-fs__pdf-thumb" />
                    <span className="h2p-fs__fname h2p-fs__fname--pdf">{t("pdfName")}</span>
                  </div>

                  <span className="h2p-fs__beam" />
                </div>

                <span className="h2p-fs__ok">
                  <span className="h2p-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h2p-fs__footer">
          <button type="button" className="h2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="h2p-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
