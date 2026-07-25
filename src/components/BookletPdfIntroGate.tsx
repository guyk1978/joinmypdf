"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import "./intro-pdf-mockup.css";
import "./booklet-pdf-landing.css";


type BookletPdfIntroGateProps = {
  /** When false, children render immediately (non–booklet tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PDF to Booklet.
 * Flat sheet → folds along a center spine into an open booklet.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function BookletPdfIntroGate({
  active = true,
  children,
}: BookletPdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-booklet-intro",
  });
  const t = useTranslations("BookletPdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="bk-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-fs-title"
      >
        <header className="bk-fs__header">
          <h1 id="bk-fs-title" className="bk-fs__title">
            <span className="bk-fs__title-brand">{t("brand")}</span>
            <span className="bk-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="bk-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="bk-fs__stage" aria-hidden>
          <div className="bk-fs__scene">
            <div className="bk-fs__book">
              <div className="bk-fs__spine" />

              <article className="bk-fs__leaf bk-fs__leaf--left">
                <div className="bk-fs__leaf-face">
                  <IntroPdfMockup title={t("leftPage")} badge={1} />
                </div>
              </article>

              <article className="bk-fs__leaf bk-fs__leaf--right">
                <div className="bk-fs__leaf-face">
                  <IntroPdfMockup title={t("rightPage")} badge={2} />
                </div>
              </article>

              <span className="bk-fs__bind-glow" />
            </div>

            <p className="bk-fs__caption">{t("caption")}</p>
          </div>
        </div>

        <div className="bk-fs__footer">
          <button type="button" className="bk-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="bk-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
