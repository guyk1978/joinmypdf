"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { IntroPdfMockup } from "@/components/IntroPdfMockup";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./intro-pdf-mockup.css";
import "./booklet-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type BookletPdfIntroGateProps = {
  /** When false, children render immediately (non–booklet tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PDF to Booklet.
 * Flat sheet → folds along a center spine into an open booklet.
 * Only runs inside the ToolModal CALC embed.
 */
export function BookletPdfIntroGate({
  active = true,
  children,
}: BookletPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("BookletPdfLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-booklet-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-booklet-intro");
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
        className="bk-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-fs-title"
      >
        <header className="bk-fs__header">
          <h1 id="bk-fs-title" className="bk-fs__title">
            <span className="bk-fs__title-brand">{t("brand")}</span>
            <span className="bk-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="bk-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="bk-fs__stage" aria-hidden>
          <div className="bk-fs__scene">
            <div className="bk-fs__book">
              <div className="bk-fs__spine" />

              <article className="bk-fs__leaf bk-fs__leaf--left">
                <div className="bk-fs__leaf-face">
                  <IntroPdfMockup title={t("leftPage")} badge={1} />
                </div>
              </article>

              <article className="bk-fs__leaf bk-fs__leaf--right">
                <div className="bk-fs__leaf-face">
                  <IntroPdfMockup title={t("rightPage")} badge={2} />
                </div>
              </article>

              <span className="bk-fs__bind-glow" />
            </div>

            <p className="bk-fs__caption">{t("caption")}</p>
          </div>
        </div>

        <div className="bk-fs__footer">
          <button type="button" className="bk-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="bk-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
