"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./autocad-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type AutocadToPdfIntroGateProps = {
  /** When false, children render immediately (non–autocad-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for AutoCAD (DWG/DXF) to PDF.
 * Blueprint wireframe → laser scan → polished PDF card with red badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function AutocadToPdfIntroGate({
  active = true,
  children,
}: AutocadToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("AutocadToPdfLanding");
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

    document.documentElement.setAttribute("data-autocad-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-autocad-intro");
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
        className="cad-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cad-fs-title"
      >
        <header className="cad-fs__header">
          <h1 id="cad-fs-title" className="cad-fs__title">
            <span className="cad-fs__title-brand">{t("brand")}</span>
            <span className="cad-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cad-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cad-fs__stage" aria-hidden>
          <div className="cad-fs__scene">
            <div className="cad-fs__workspace">
              <div className="cad-fs__blueprint">
                <div className="cad-fs__grid" />
                <div className="cad-fs__crosshair cad-fs__crosshair--h" />
                <div className="cad-fs__crosshair cad-fs__crosshair--v" />
                <svg
                  className="cad-fs__wire"
                  viewBox="0 0 320 220"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Simple floor-plan outline */}
                  <rect x="36" y="28" width="248" height="164" className="cad-fs__stroke" />
                  <rect x="52" y="44" width="100" height="72" className="cad-fs__stroke" />
                  <rect x="168" y="44" width="100" height="72" className="cad-fs__stroke" />
                  <rect x="52" y="132" width="216" height="44" className="cad-fs__stroke" />
                  <line x1="102" y1="44" x2="102" y2="116" className="cad-fs__stroke cad-fs__stroke--dim" />
                  <line x1="218" y1="44" x2="218" y2="116" className="cad-fs__stroke cad-fs__stroke--dim" />
                  <line x1="52" y1="154" x2="268" y2="154" className="cad-fs__stroke cad-fs__stroke--dim" />
                  <circle cx="160" cy="154" r="10" className="cad-fs__stroke cad-fs__stroke--dim" />
                  <path
                    d="M 70 116 L 70 132 M 250 116 L 250 132"
                    className="cad-fs__stroke"
                  />
                </svg>
                <div className="cad-fs__laser" />
                <span className="cad-fs__src-badge">{t("srcBadge")}</span>
                <span className="cad-fs__coords">{t("coords")}</span>
              </div>

              <div className="cad-fs__pdf">
                <div className="cad-fs__pdf-sheet">
                  <span className="cad-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="cad-fs__pdf-lines">
                    <span /><span /><span /><span />
                  </div>
                  <span className="cad-fs__vector">{t("vector")}</span>
                </div>
                <span className="cad-fs__pdf-name">{t("pdfName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cad-fs__footer">
          <button type="button" className="cad-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="cad-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
