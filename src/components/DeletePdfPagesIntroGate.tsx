"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./intro-pdf-mockup.css";
import "./delete-pdf-pages-landing.css";

type IntroPhase = "intro" | "workspace";

type DeletePdfPagesIntroGateProps = {
  /** When false, children render immediately (non–delete-pages tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Delete PDF Pages.
 * Single large document: pages flip, then an unwanted page is crossed out and dissolves.
 * Only runs inside the ToolModal CALC embed.
 */
export function DeletePdfPagesIntroGate({
  active = true,
  children,
}: DeletePdfPagesIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("DeletePdfPagesLanding");
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

    document.documentElement.setAttribute("data-delete-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-delete-intro");
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
        className="del-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="del-fs-title"
      >
        <header className="del-fs__header">
          <h1 id="del-fs-title" className="del-fs__title">
            <span className="del-fs__title-brand">{t("brand")}</span>
            <span className="del-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="del-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="del-fs__stage" aria-hidden>
          <div className="del-fs__doc">
            <div className="del-fs__spine" />
            <div className="del-fs__flip">
              <article className="del-fs__sheet del-fs__sheet--keep del-fs__sheet--1">
                <IntroPdfMockup title={t("pageLabel", { n: 1 })} badge={1} />
              </article>
              <article className="del-fs__sheet del-fs__sheet--target">
                <IntroPdfMockup title={t("pageLabel", { n: 2 })} badge={2} />
                <span className="del-fs__shard del-fs__shard--1" />
                <span className="del-fs__shard del-fs__shard--2" />
                <span className="del-fs__shard del-fs__shard--3" />
                <span className="del-fs__shard del-fs__shard--4" />
                <span className="del-fs__shard del-fs__shard--5" />
                <span className="del-fs__cross">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path
                      d="M12 12l24 24M36 12L12 36"
                      stroke="currentColor"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="del-fs__red-glow" />
              </article>
              <article className="del-fs__sheet del-fs__sheet--keep del-fs__sheet--3">
                <IntroPdfMockup title={t("pageLabel", { n: 3 })} badge={3} />
              </article>
            </div>
            <div className="del-fs__stack-edge" />
          </div>
        </div>

        <div className="del-fs__footer">
          <button type="button" className="del-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="del-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
