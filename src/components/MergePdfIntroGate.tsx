"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import "./intro-pdf-mockup.css";
import "./merge-pdf-landing.css";


type MergePdfIntroGateProps = {
  /** When false, children render immediately (non–merge tools). */
  active?: boolean;
  children: ReactNode;
};

function MergeArrow({ direction }: { direction: "ltr" | "rtl" }) {
  return (
    <div className={`mrg-fs__bridge mrg-fs__bridge--${direction}`} aria-hidden>
      <span className="mrg-fs__stream" />
      <svg className="mrg-fs__arrow" viewBox="0 0 120 40" fill="none">
        {direction === "ltr" ? (
          <>
            <path
              d="M4 20h78"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M68 6l46 14-46 14"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path
              d="M116 20H38"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M52 6L6 20l46 14"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
      <span className="mrg-fs__stream" />
    </div>
  );
}

/**
 * One-way cinematic fullscreen splash for Merge PDF.
 * Compact horizontal row: source → arrows → master ← arrows ← source.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function MergePdfIntroGate({
  active = true,
  children,
}: MergePdfIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-merge-intro",
  });
  const t = useTranslations("MergePdfLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="mrg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mrg-fs-title"
      >
        <header className="mrg-fs__header">
          <h1 id="mrg-fs-title" className="mrg-fs__title">
            <span className="mrg-fs__title-brand">{t("brand")}</span>
            <span className="mrg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="mrg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="mrg-fs__stage" aria-hidden>
          <div className="mrg-fs__row">
            <article className="mrg-fs__doc mrg-fs__doc--left">
              <IntroPdfMockup title={t("docContract")} badge={1} />
            </article>

            <MergeArrow direction="ltr" />

            <div className="mrg-fs__master">
              <span className="mrg-fs__master-layer mrg-fs__master-layer--3" />
              <span className="mrg-fs__master-layer mrg-fs__master-layer--2" />
              <span className="mrg-fs__master-layer mrg-fs__master-layer--1" />
              <article className="mrg-fs__master-face">
                <IntroPdfMockup title={t("mergedLabel")} badge={t("mergedBadge")} />
              </article>
              <span className="mrg-fs__fuse-glow" />
            </div>

            <MergeArrow direction="rtl" />

            <article className="mrg-fs__doc mrg-fs__doc--right">
              <IntroPdfMockup title={t("docReport")} badge={2} />
            </article>
          </div>
        </div>

        <div className="mrg-fs__footer">
          <button type="button" className="mrg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="mrg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
