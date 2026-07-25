"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./compress-pdf-landing.css";


type CompressPdfIntroGateProps = {
  /** When false, children render immediately (non–pdf-compress tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Compress PDF Online.
 * A bulky PDF shrinks while a storage meter drops to an optimized size.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function CompressPdfIntroGate({
  active = true,
  children,
}: CompressPdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-compress-intro",
  });
  const t = useTranslations("CompressPdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="cmp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="cmp-fs__header">
          <h1 id="cmp-fs-title" className="cmp-fs__title">
            <span className="cmp-fs__title-brand">{t("brand")}</span>
            <span className="cmp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cmp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cmp-fs__stage" aria-hidden>
          <div className="cmp-fs__scene">
            <div
              className="cmp-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="cmp-fs__card">
                <div className="cmp-fs__badges">
                  <span className="cmp-fs__badge cmp-fs__badge--heavy">{t("heavyBadge")}</span>
                  <span className="cmp-fs__arrow" />
                  <span className="cmp-fs__badge cmp-fs__badge--opt">{t("optBadge")}</span>
                </div>

                <div className="cmp-fs__stage-art">
                  <div className="cmp-fs__file">
                    <span className="cmp-fs__file-fold" />
                    <span className="cmp-fs__file-mark">{t("pdfBadge")}</span>
                    <span className="cmp-fs__file-title">{t("docTitle")}</span>
                    <span className="cmp-fs__file-bar" />
                    <span className="cmp-fs__file-line" />
                    <span className="cmp-fs__file-line cmp-fs__file-line--short" />
                    <span className="cmp-fs__file-weight">{t("sizeHeavy")}</span>
                  </div>

                  <div className="cmp-fs__meter">
                    <div className="cmp-fs__meter-track">
                      <span className="cmp-fs__meter-fill" />
                    </div>
                    <div className="cmp-fs__meter-labels">
                      <span className="cmp-fs__meter-from">{t("sizeHeavy")}</span>
                      <span className="cmp-fs__meter-to">{t("sizeLean")}</span>
                    </div>
                    <span className="cmp-fs__meter-needle" />
                  </div>

                  <div className="cmp-fs__file cmp-fs__file--lean">
                    <span className="cmp-fs__file-fold" />
                    <span className="cmp-fs__file-mark">{t("pdfBadge")}</span>
                    <span className="cmp-fs__file-title">{t("docTitle")}</span>
                    <span className="cmp-fs__file-bar" />
                    <span className="cmp-fs__file-line" />
                    <span className="cmp-fs__file-weight cmp-fs__file-weight--lean">
                      {t("sizeLean")}
                    </span>
                  </div>
                </div>

                <span className="cmp-fs__ok">
                  <span className="cmp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="cmp-fs__footer">
          <button type="button" className="cmp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="cmp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
