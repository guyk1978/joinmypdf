"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./intro-pdf-mockup.css";
import "./n-up-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type NUpPdfIntroGateProps = {
  /** When false, children render immediately (non–N-Up tools). */
  active?: boolean;
  children: ReactNode;
};

const SOURCE_CARDS = [
  { id: "1", titleKey: "docAnnualReport", tone: "a" },
  { id: "2", titleKey: "docMarketAnalysis", tone: "b" },
  { id: "3", titleKey: "docFinancialOverview", tone: "c" },
  { id: "4", titleKey: "docKeyHighlights", tone: "d" },
] as const;

/**
 * One-way cinematic fullscreen splash for N-Up PDF.
 * Pitch-black fixed viewport → Get Started unmounts splash and mounts workspace.
 * Only runs inside the ToolModal CALC embed so the hard tool route (modal host)
 * does not paint a second splash over the site header.
 */
export function NUpPdfIntroGate({ active = true, children }: NUpPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("NUpPdfLanding");
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

    document.documentElement.setAttribute("data-nup-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-nup-intro");
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
        className="nup-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nup-fs-title"
      >
        <header className="nup-fs__header">
          <h1 id="nup-fs-title" className="nup-fs__title">
            <span className="nup-fs__title-brand">{t("brand")}</span>
            <span className="nup-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="nup-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="nup-fs__body">
          <div className="nup-fs__stage" aria-hidden>
            <div className="nup-fs__sources">
              {SOURCE_CARDS.map((card) => (
                <article
                  key={card.id}
                  className={`nup-fs__source nup-fs__source--${card.tone}`}
                >
                  <IntroPdfMockup title={t(card.titleKey)} badge={card.id} />
                </article>
              ))}
            </div>

            <div className="nup-fs__bridge">
              <span className="nup-fs__stream" />
              <svg className="nup-fs__arrow" viewBox="0 0 160 48" fill="none" aria-hidden>
                <path
                  d="M4 24h118"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M106 8l48 16-48 16"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="nup-fs__stream" />
            </div>

            <div className="nup-fs__target">
              <div className="nup-fs__sheet">
                <span className="nup-fs__sheet-label">PDF</span>
                {SOURCE_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className={`nup-fs__cell nup-fs__cell--${card.tone}`}
                  >
                    <IntroPdfMockup
                      compact
                      title={t(card.titleKey)}
                      badge={card.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="nup-fs__footer">
            <button type="button" className="nup-fs__cta" onClick={startTool}>
              {t("getStarted")}
            </button>
          </div>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="nup-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
