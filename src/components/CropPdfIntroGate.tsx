"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./crop-pdf-landing.css";


type CropPdfIntroGateProps = {
  /** When false, children render immediately (non–crop-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Crop PDF Online.
 * Scanned page with margins → edge-detect crop engine → tight green crop box → success.
 * Shows before the crop workspace (embed modal and dedicated tool page).
 */
export function CropPdfIntroGate({
  active = true,
  children,
}: CropPdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-crop-pdf-intro",
  });
  const t = useTranslations("CropPdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="cpf-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpf-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="cpf-fs__header">
          <h1 id="cpf-fs-title" className="cpf-fs__title">
            <span className="cpf-fs__title-brand">{t("brand")}</span>
            <span className="cpf-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cpf-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cpf-fs__stage" aria-hidden>
          <div className="cpf-fs__scene">
            <div className="cpf-fs__workspace animation-workspace">
              <div className="cpf-fs__card">
                <div className="cpf-fs__pipeline">
                  <div className="cpf-fs__pane cpf-fs__pane--scan">
                    <span className="cpf-fs__tag">{t("scanTag")}</span>
                    <div className="cpf-fs__page cpf-fs__page--scan">
                      <div className="cpf-fs__margins" />
                      <div className="cpf-fs__content">
                        <span className="cpf-fs__line cpf-fs__line--title" />
                        <span className="cpf-fs__line" />
                        <span className="cpf-fs__line cpf-fs__line--short" />
                        <span className="cpf-fs__line" />
                        <span className="cpf-fs__line cpf-fs__line--mid" />
                      </div>
                      <span className="cpf-fs__laser" />
                    </div>
                  </div>

                  <div className="cpf-fs__engine">
                    <span className="cpf-fs__flow" />
                    <span className="cpf-fs__core" />
                    <span className="cpf-fs__badge cpf-fs__badge--before">{t("dimBefore")}</span>
                    <span className="cpf-fs__badge cpf-fs__badge--after">{t("dimAfter")}</span>
                  </div>

                  <div className="cpf-fs__pane cpf-fs__pane--crop">
                    <span className="cpf-fs__tag cpf-fs__tag--crop">{t("cropTag")}</span>
                    <div className="cpf-fs__page cpf-fs__page--crop">
                      <div className="cpf-fs__content cpf-fs__content--tight">
                        <span className="cpf-fs__line cpf-fs__line--title" />
                        <span className="cpf-fs__line" />
                        <span className="cpf-fs__line cpf-fs__line--short" />
                        <span className="cpf-fs__line" />
                        <span className="cpf-fs__line cpf-fs__line--mid" />
                      </div>
                      <div className="cpf-fs__crop">
                        <span className="cpf-fs__bound cpf-fs__bound--t" />
                        <span className="cpf-fs__bound cpf-fs__bound--r" />
                        <span className="cpf-fs__bound cpf-fs__bound--b" />
                        <span className="cpf-fs__bound cpf-fs__bound--l" />
                        <span className="cpf-fs__handle cpf-fs__handle--nw" />
                        <span className="cpf-fs__handle cpf-fs__handle--ne" />
                        <span className="cpf-fs__handle cpf-fs__handle--sw" />
                        <span className="cpf-fs__handle cpf-fs__handle--se" />
                      </div>
                    </div>
                  </div>
                </div>

                <span className="cpf-fs__particle cpf-fs__particle--1" />
                <span className="cpf-fs__particle cpf-fs__particle--2" />
                <span className="cpf-fs__particle cpf-fs__particle--3" />

                <span className="cpf-fs__ok">
                  <span className="cpf-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="cpf-fs__footer">
          <button type="button" className="cpf-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="cpf-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
