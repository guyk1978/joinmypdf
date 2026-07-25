"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./invoice-generator-landing.css";


type InvoiceGeneratorIntroGateProps = {
  /** When false, children render immediately (non–invoice-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Invoice & Receipt Generator Online.
 * Line-item form → tax/total engine → professional invoice PDF preview → success.
 * Shows before the invoice workspace (dedicated tool page).
 */
export function InvoiceGeneratorIntroGate({
  active = true,
  children,
}: InvoiceGeneratorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-invoice-intro",
  });
  const t = useTranslations("InvoiceGeneratorLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="inv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inv-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="inv-fs__header">
          <h1 id="inv-fs-title" className="inv-fs__title">
            <span className="inv-fs__title-brand">{t("brand")}</span>
            <span className="inv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="inv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="inv-fs__stage" aria-hidden>
          <div className="inv-fs__scene">
            <div className="inv-fs__workspace animation-workspace">
              <div className="inv-fs__card">
                <div className="inv-fs__pipeline">
                  <div className="inv-fs__pane inv-fs__pane--form">
                    <span className="inv-fs__tag">{t("formTag")}</span>
                    <div className="inv-fs__form">
                      <p className="inv-fs__field inv-fs__field--1">
                        <span className="inv-fs__label">{t("clientLabel")}</span>
                        <span className="inv-fs__value">Acme Studio</span>
                      </p>
                      <div className="inv-fs__rows">
                        <div className="inv-fs__row inv-fs__row--head">
                          <span>{t("colItem")}</span>
                          <span>{t("colQty")}</span>
                          <span>{t("colPrice")}</span>
                        </div>
                        <div className="inv-fs__row inv-fs__row--1">
                          <span>Design</span>
                          <span>2</span>
                          <span>$120</span>
                        </div>
                        <div className="inv-fs__row inv-fs__row--2">
                          <span>Hosting</span>
                          <span>1</span>
                          <span>$40</span>
                        </div>
                      </div>
                      <span className="inv-fs__laser" />
                    </div>
                  </div>

                  <div className="inv-fs__engine">
                    <span className="inv-fs__flow" />
                    <span className="inv-fs__core" />
                    <span className="inv-fs__badge">{t("formatBadge")}</span>
                  </div>

                  <div className="inv-fs__pane inv-fs__pane--doc">
                    <span className="inv-fs__tag inv-fs__tag--doc">{t("docTag")}</span>
                    <div className="inv-fs__doc">
                      <div className="inv-fs__doc-head">
                        <span className="inv-fs__doc-title">{t("invoiceTitle")}</span>
                        <span className="inv-fs__doc-no">#1042</span>
                      </div>
                      <div className="inv-fs__totals">
                        <div className="inv-fs__total inv-fs__total--1">
                          <span>{t("subtotal")}</span>
                          <span>$280.00</span>
                        </div>
                        <div className="inv-fs__total inv-fs__total--2">
                          <span>{t("tax")}</span>
                          <span>$28.00</span>
                        </div>
                        <div className="inv-fs__total inv-fs__total--3">
                          <span>{t("grandTotal")}</span>
                          <span>$308.00</span>
                        </div>
                      </div>
                      <div className="inv-fs__pdf-bar">{t("pdfReady")}</div>
                    </div>
                  </div>
                </div>

                <span className="inv-fs__particle inv-fs__particle--1" />
                <span className="inv-fs__particle inv-fs__particle--2" />
                <span className="inv-fs__particle inv-fs__particle--3" />

                <span className="inv-fs__ok">
                  <span className="inv-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="inv-fs__footer">
          <button type="button" className="inv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="inv-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
