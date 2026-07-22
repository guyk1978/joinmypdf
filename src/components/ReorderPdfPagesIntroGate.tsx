"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./intro-pdf-mockup.css";
import "./reorder-pdf-pages-landing.css";

type IntroPhase = "intro" | "workspace";

type ReorderPdfPagesIntroGateProps = {
  /** When false, children render immediately (non–reorder tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Reorder PDF Pages.
 * Filmstrip of thumbnails; one page lifts and slides into a new slot.
 * Only runs inside the ToolModal CALC embed.
 */
export function ReorderPdfPagesIntroGate({
  active = true,
  children,
}: ReorderPdfPagesIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ReorderPdfPagesLanding");
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

    document.documentElement.setAttribute("data-reorder-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-reorder-intro");
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
        className="reo-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reo-fs-title"
      >
        <header className="reo-fs__header">
          <h1 id="reo-fs-title" className="reo-fs__title">
            <span className="reo-fs__title-brand">{t("brand")}</span>
            <span className="reo-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="reo-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="reo-fs__stage" aria-hidden>
          <div className="reo-fs__scene">
            <div className="reo-fs__strip">
              <span className="reo-fs__drop" />

              <article className="reo-fs__thumb reo-fs__thumb--1">
                <IntroPdfMockup title={t("pageLabel", { n: 1 })} badge={1} compact />
                <span className="reo-fs__pos">1</span>
              </article>

              <article className="reo-fs__thumb reo-fs__thumb--2">
                <IntroPdfMockup title={t("pageLabel", { n: 2 })} badge={2} compact />
                <span className="reo-fs__pos">2</span>
              </article>

              <article className="reo-fs__thumb reo-fs__thumb--3 reo-fs__thumb--moving">
                <IntroPdfMockup title={t("pageLabel", { n: 3 })} badge={3} compact />
                <span className="reo-fs__pos">3</span>
                <span className="reo-fs__ghost-cursor" />
              </article>

              <article className="reo-fs__thumb reo-fs__thumb--4">
                <IntroPdfMockup title={t("pageLabel", { n: 4 })} badge={4} compact />
                <span className="reo-fs__pos">4</span>
              </article>
            </div>

            <p className="reo-fs__caption">{t("caption")}</p>
          </div>
        </div>

        <div className="reo-fs__footer">
          <button type="button" className="reo-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="reo-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
