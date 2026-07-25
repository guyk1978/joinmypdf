"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./batch-rename-pdf-landing.css";


type BatchRenamePdfIntroGateProps = {
  /** When false, children render immediately (non–batch-rename-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

const RENAME_ROWS = [
  { old: "scan_001_final_v2.pdf", next: "invoice_01.pdf" },
  { old: "DOC-Copy (3).pdf", next: "invoice_02.pdf" },
  { old: "untitled_export.pdf", next: "invoice_03.pdf" },
] as const;

/**
 * One-way cinematic fullscreen splash for Batch Rename PDF Files.
 * Cluttered filenames transform in unison into clean, patterned names.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function BatchRenamePdfIntroGate({
  active = true,
  children,
}: BatchRenamePdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-batch-rename-pdf-intro",
  });
  const t = useTranslations("BatchRenamePdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="brn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brn-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="brn-fs__header">
          <h1 id="brn-fs-title" className="brn-fs__title">
            <span className="brn-fs__title-brand">{t("brand")}</span>
            <span className="brn-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="brn-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="brn-fs__stage" aria-hidden>
          <div className="brn-fs__scene">
            <div
              className="brn-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="brn-fs__card">
                <div className="brn-fs__badges">
                  <span className="brn-fs__badge brn-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="brn-fs__arrow" />
                  <span className="brn-fs__badge brn-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="brn-fs__stage-art">
                  <ul className="brn-fs__list">
                    {RENAME_ROWS.map((row, index) => (
                      <li
                        key={row.old}
                        className={`brn-fs__row brn-fs__row--${index + 1}`}
                      >
                        <span className="brn-fs__file-icon" />
                        <span className="brn-fs__names">
                          <span className="brn-fs__name brn-fs__name--old">{row.old}</span>
                          <span className="brn-fs__name brn-fs__name--next">{row.next}</span>
                        </span>
                        <span className="brn-fs__tick" />
                      </li>
                    ))}
                  </ul>
                </div>

                <span className="brn-fs__ok">
                  <span className="brn-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="brn-fs__footer">
          <button type="button" className="brn-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="brn-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
