"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./pdf-signature-validator-landing.css";


type PdfSignatureValidatorIntroGateProps = {
  /** When false, children render immediately (non–pdf-signature-validator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for PDF Signature Validator Online.
 * Signed PDF + seal → verification laser → Cryptographically Secure badge.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function PdfSignatureValidatorIntroGate({
  active = true,
  children,
}: PdfSignatureValidatorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-pdf-signature-validator-intro",
  });
  const t = useTranslations("PdfSignatureValidatorLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="psv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="psv-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="psv-fs__header">
          <h1 id="psv-fs-title" className="psv-fs__title">
            <span className="psv-fs__title-brand">{t("brand")}</span>
            <span className="psv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="psv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="psv-fs__stage" aria-hidden>
          <div className="psv-fs__scene">
            <div className="psv-fs__workspace animation-workspace">
              <div className="psv-fs__card">
                <div className="psv-fs__badges">
                  <span className="psv-fs__badge psv-fs__badge--signed">{t("signedBadge")}</span>
                  <span className="psv-fs__badge psv-fs__badge--secure">{t("secureBadge")}</span>
                </div>

                <div className="psv-fs__doc-wrap">
                  <div className="psv-fs__doc">
                    <span className="psv-fs__line psv-fs__line--title" />
                    <span className="psv-fs__line" />
                    <span className="psv-fs__line psv-fs__line--short" />
                    <span className="psv-fs__line" />
                    <span className="psv-fs__line psv-fs__line--mid" />
                    <span className="psv-fs__seal" />
                  </div>

                  <div className="psv-fs__laser" />

                  <span className="psv-fs__verified">
                    <span className="psv-fs__verified-icon" />
                    {t("verifiedBadge")}
                  </span>
                </div>
              </div>

              <span className="psv-fs__ok">
                <span className="psv-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="psv-fs__footer">
          <button type="button" className="psv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="psv-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
