"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./intro-pdf-mockup.css";
import "./split-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type SplitPdfIntroGateProps = {
  /** When false, children render immediately (non–split tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Split PDF.
 * Single center document → laser cut → two files slide apart.
 * Only runs inside the ToolModal CALC embed.
 */
export function SplitPdfIntroGate({
  active = true,
  children,
}: SplitPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("SplitPdfLanding");
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

    document.documentElement.setAttribute("data-split-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-split-intro");
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
        className="spl-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spl-fs-title"
      >
        <header className="spl-fs__header">
          <h1 id="spl-fs-title" className="spl-fs__title">
            <span className="spl-fs__title-brand">{t("brand")}</span>
            <span className="spl-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="spl-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="spl-fs__stage" aria-hidden>
          <div className="spl-fs__scene">
            {/* Original document — starts centered, yields to the split */}
            <article className="spl-fs__source">
              <IntroPdfMockup title={t("sourceLabel")} badge={t("sourceBadge")} />
            </article>

            {/* Laser / parting line */}
            <div className="spl-fs__cut">
              <span className="spl-fs__cut-beam" />
              <span className="spl-fs__cut-core" />
              <span className="spl-fs__cut-glow" />
            </div>

            {/* Resulting file A — slides left */}
            <article className="spl-fs__half spl-fs__half--left">
              <IntroPdfMockup title={t("partA")} badge="A" />
              <span className="spl-fs__meta">{t("pagesA")}</span>
            </article>

            {/* Resulting file B — slides right */}
            <article className="spl-fs__half spl-fs__half--right">
              <IntroPdfMockup title={t("partB")} badge="B" />
              <span className="spl-fs__meta">{t("pagesB")}</span>
            </article>
          </div>
        </div>

        <div className="spl-fs__footer">
          <button type="button" className="spl-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="spl-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
