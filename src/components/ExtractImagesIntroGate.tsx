"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./extract-images-landing.css";


type ExtractImagesIntroGateProps = {
  /** When false, children render immediately (non–extract-images tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Extract Images from PDF.
 * PDF with embedded images → scanner → images float out as JPG/PNG assets.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function ExtractImagesIntroGate({
  active = true,
  children,
}: ExtractImagesIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-extract-images-intro",
  });
  const t = useTranslations("ExtractImagesLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ximg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ximg-fs-title"
      >
        <header className="ximg-fs__header">
          <h1 id="ximg-fs-title" className="ximg-fs__title">
            <span className="ximg-fs__title-brand">{t("brand")}</span>
            <span className="ximg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ximg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ximg-fs__stage" aria-hidden>
          <div className="ximg-fs__scene">
            <div className="ximg-fs__workspace animation-workspace">
              <div className="ximg-fs__particles">
                <span /><span /><span /><span /><span /><span />
              </div>

              <div className="ximg-fs__pdf">
                <div className="ximg-fs__pdf-sheet">
                  <span className="ximg-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="ximg-fs__lines">
                    <span /><span /><span />
                  </div>
                  <div className="ximg-fs__embeds">
                    <div className="ximg-fs__embed ximg-fs__embed--a" />
                    <div className="ximg-fs__embed ximg-fs__embed--b" />
                  </div>
                  <div className="ximg-fs__lines ximg-fs__lines--bottom">
                    <span /><span />
                  </div>
                  <div className="ximg-fs__scan" />
                </div>
                <span className="ximg-fs__pdf-name">{t("pdfName")}</span>
              </div>

              <div className="ximg-fs__assets">
                <div className="ximg-fs__asset ximg-fs__asset--jpg">
                  <div className="ximg-fs__thumb ximg-fs__thumb--jpg" />
                  <span className="ximg-fs__fmt ximg-fs__fmt--jpg">{t("jpgBadge")}</span>
                </div>
                <div className="ximg-fs__asset ximg-fs__asset--png">
                  <div className="ximg-fs__thumb ximg-fs__thumb--png" />
                  <span className="ximg-fs__fmt ximg-fs__fmt--png">{t("pngBadge")}</span>
                </div>
                <span className="ximg-fs__ok">
                  <span className="ximg-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ximg-fs__footer">
          <button type="button" className="ximg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="ximg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
