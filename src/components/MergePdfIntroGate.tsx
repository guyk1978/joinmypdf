"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./intro-pdf-mockup.css";
import "./merge-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

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
 * Only runs inside the ToolModal CALC embed.
 */
export function MergePdfIntroGate({
  active = true,
  children,
}: MergePdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("MergePdfLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-merge-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-merge-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="mrg-fs"
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
      return <div className="mrg-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
