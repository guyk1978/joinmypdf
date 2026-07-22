"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./intro-pdf-mockup.css";
import "./extract-pdf-pages-landing.css";

type IntroPhase = "intro" | "workspace";

type ExtractPdfPagesIntroGateProps = {
  /** When false, children render immediately (non–extract-pages tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Extract PDF Pages.
 * Source stack (left) → pages lift with blue trail → new document (right).
 * Only runs inside the ToolModal CALC embed.
 */
export function ExtractPdfPagesIntroGate({
  active = true,
  children,
}: ExtractPdfPagesIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ExtractPdfPagesLanding");
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

    document.documentElement.setAttribute("data-extract-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-extract-intro");
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
        className="ext-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ext-fs-title"
      >
        <header className="ext-fs__header">
          <h1 id="ext-fs-title" className="ext-fs__title">
            <span className="ext-fs__title-brand">{t("brand")}</span>
            <span className="ext-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ext-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ext-fs__stage" aria-hidden>
          <div className="ext-fs__scene">
            {/* Source multi-page stack */}
            <div className="ext-fs__source">
              <span className="ext-fs__label">{t("sourceLabel")}</span>
              <div className="ext-fs__stack">
                <article className="ext-fs__layer ext-fs__layer--3">
                  <IntroPdfMockup title={t("pageLabel", { n: 4 })} badge={4} compact />
                </article>
                <article className="ext-fs__layer ext-fs__layer--2">
                  <IntroPdfMockup title={t("pageLabel", { n: 3 })} badge={3} compact />
                </article>
                <article className="ext-fs__layer ext-fs__layer--1">
                  <IntroPdfMockup title={t("pageLabel", { n: 1 })} badge={1} compact />
                </article>
                {/* Ghost slots that “release” flying pages */}
                <span className="ext-fs__slot ext-fs__slot--a" />
                <span className="ext-fs__slot ext-fs__slot--b" />
              </div>
            </div>

            {/* Flying extracted pages + blue trail */}
            <div className="ext-fs__flight">
              <span className="ext-fs__trail" />
              <article className="ext-fs__flyer ext-fs__flyer--a">
                <IntroPdfMockup title={t("pageLabel", { n: 2 })} badge={2} compact />
              </article>
              <article className="ext-fs__flyer ext-fs__flyer--b">
                <IntroPdfMockup title={t("pageLabel", { n: 5 })} badge={5} compact />
              </article>
            </div>

            {/* New extracted document */}
            <div className="ext-fs__result">
              <span className="ext-fs__label">{t("resultLabel")}</span>
              <div className="ext-fs__assembled">
                <article className="ext-fs__result-page ext-fs__result-page--b">
                  <IntroPdfMockup title={t("pageLabel", { n: 5 })} badge={5} />
                </article>
                <article className="ext-fs__result-page ext-fs__result-page--a">
                  <IntroPdfMockup title={t("pageLabel", { n: 2 })} badge={2} />
                </article>
                <span className="ext-fs__assemble-glow" />
              </div>
            </div>
          </div>
        </div>

        <div className="ext-fs__footer">
          <button type="button" className="ext-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="ext-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
