"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./redact-pdf-landing.css";


type RedactPdfIntroGateProps = {
  /** When false, children render immediately (non–redact tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Redact PDF Online.
 * Document text lines → black redaction bars slide over secrets → sanitized badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function RedactPdfIntroGate({
  active = true,
  children,
}: RedactPdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-redact-pdf-intro",
  });
  const t = useTranslations("RedactPdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="rdc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rdc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="rdc-fs__header">
          <h1 id="rdc-fs-title" className="rdc-fs__title">
            <span className="rdc-fs__title-brand">{t("brand")}</span>
            <span className="rdc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rdc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rdc-fs__stage" aria-hidden>
          <div className="rdc-fs__scene">
            <div className="rdc-fs__workspace animation-workspace">
              <div className="rdc-fs__card">
                <div className="rdc-fs__badges">
                  <span className="rdc-fs__badge rdc-fs__badge--sensitive">{t("sensitiveBadge")}</span>
                  <span className="rdc-fs__badge rdc-fs__badge--clean">{t("cleanBadge")}</span>
                </div>

                <div className="rdc-fs__doc">
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text">{t("lineName")}</span>
                    <span className="rdc-fs__bar rdc-fs__bar--1" />
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text">{t("lineAccount")}</span>
                    <span className="rdc-fs__bar rdc-fs__bar--2" />
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text rdc-fs__text--safe">{t("lineAddress")}</span>
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text">{t("lineSsn")}</span>
                    <span className="rdc-fs__bar rdc-fs__bar--3" />
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text rdc-fs__text--safe">{t("lineNotes")}</span>
                  </div>
                </div>
              </div>

              <span className="rdc-fs__ok">
                <span className="rdc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="rdc-fs__footer">
          <button type="button" className="rdc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="rdc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
