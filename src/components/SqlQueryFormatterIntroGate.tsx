"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./sql-query-formatter-landing.css";


type SqlQueryFormatterIntroGateProps = {
  /** When false, children render immediately (non–sql-query-formatter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for SQL Query Formatter.
 * Dense one-line SQL → indented, syntax-colored clauses + Formatted status.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function SqlQueryFormatterIntroGate({
  active = true,
  children,
}: SqlQueryFormatterIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-sql-query-formatter-intro",
  });
  const t = useTranslations("SqlQueryFormatterLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="sqf-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sqf-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="sqf-fs__header">
          <h1 id="sqf-fs-title" className="sqf-fs__title">
            <span className="sqf-fs__title-brand">{t("brand")}</span>
            <span className="sqf-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="sqf-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="sqf-fs__stage" aria-hidden>
          <div className="sqf-fs__scene">
            <div
              className="sqf-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="sqf-fs__card">
                <div className="sqf-fs__badges">
                  <span className="sqf-fs__badge sqf-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="sqf-fs__arrow" />
                  <span className="sqf-fs__badge sqf-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="sqf-fs__stage-art">
                  <div className="sqf-fs__editor">
                    <p className="sqf-fs__dense">
                      <span className="sqf-fs__kw">SELECT</span>
                      {" id,name,email "}
                      <span className="sqf-fs__kw">FROM</span>
                      {" users "}
                      <span className="sqf-fs__kw">WHERE</span>
                      {" active=1 "}
                      <span className="sqf-fs__kw">ORDER BY</span>
                      {" id DESC"}
                    </p>

                    <pre className="sqf-fs__pretty">
                      <span className="sqf-fs__line">
                        <span className="sqf-fs__kw">SELECT</span>
                      </span>
                      <span className="sqf-fs__line sqf-fs__line--indent">
                        id,
                      </span>
                      <span className="sqf-fs__line sqf-fs__line--indent">
                        name,
                      </span>
                      <span className="sqf-fs__line sqf-fs__line--indent">
                        email
                      </span>
                      <span className="sqf-fs__line">
                        <span className="sqf-fs__kw">FROM</span>
                        {" users"}
                      </span>
                      <span className="sqf-fs__line">
                        <span className="sqf-fs__kw">WHERE</span>
                        {" active = "}
                        <span className="sqf-fs__num">1</span>
                      </span>
                      <span className="sqf-fs__line">
                        <span className="sqf-fs__kw">ORDER BY</span>
                        {" id DESC"}
                      </span>
                    </pre>

                    <div className="sqf-fs__beam" />
                  </div>
                </div>

                <span className="sqf-fs__ok">
                  <span className="sqf-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sqf-fs__footer">
          <button type="button" className="sqf-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="sqf-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
