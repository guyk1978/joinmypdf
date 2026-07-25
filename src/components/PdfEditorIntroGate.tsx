"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-editor-landing.css";


type PdfEditorIntroGateProps = {
  /** When false, children render immediately (non–pdf-editor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF Editor Online.
 * A blinking cursor types and replaces text while a formatting toolbar floats in.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfEditorIntroGate({
  active = true,
  children,
}: PdfEditorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-editor-intro",
  });
  const t = useTranslations("PdfEditorLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="ped-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ped-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ped-fs__header">
          <h1 id="ped-fs-title" className="ped-fs__title">
            <span className="ped-fs__title-brand">{t("brand")}</span>
            <span className="ped-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ped-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ped-fs__stage" aria-hidden>
          <div className="ped-fs__scene">
            <div
              className="ped-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ped-fs__card">
                <div className="ped-fs__badges">
                  <span className="ped-fs__badge ped-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="ped-fs__arrow" />
                  <span className="ped-fs__badge ped-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="ped-fs__stage-art">
                  <div className="ped-fs__toolbar">
                    <span className="ped-fs__tool ped-fs__tool--b">B</span>
                    <span className="ped-fs__tool ped-fs__tool--i">I</span>
                    <span className="ped-fs__tool ped-fs__tool--u">U</span>
                    <span className="ped-fs__tool-sep" />
                    <span className="ped-fs__swatch ped-fs__swatch--blue" />
                    <span className="ped-fs__swatch ped-fs__swatch--ink" />
                  </div>

                  <div className="ped-fs__doc">
                    <span className="ped-fs__fold" />
                    <span className="ped-fs__title-line" />
                    <span className="ped-fs__line" />
                    <span className="ped-fs__edit-line">
                      <span className="ped-fs__old">{t("oldWord")}</span>
                      <span className="ped-fs__typed">
                        <span className="ped-fs__typed-text">{t("newWord")}</span>
                        <span className="ped-fs__caret" />
                      </span>
                    </span>
                    <span className="ped-fs__line ped-fs__line--short" />
                    <span className="ped-fs__line" />
                  </div>
                </div>

                <span className="ped-fs__ok">
                  <span className="ped-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ped-fs__footer">
          <button type="button" className="ped-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ped-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
