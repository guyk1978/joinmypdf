"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./flatten-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type FlattenPdfIntroGateProps = {
  /** When false, children render immediately (non–flatten-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Flatten PDF Online.
 * Multi-level layers and annotations merge into a single print-ready sheet.
 * Only runs inside the ToolModal CALC embed.
 */
export function FlattenPdfIntroGate({
  active = true,
  children,
}: FlattenPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("FlattenPdfLanding");
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

    document.documentElement.setAttribute("data-flatten-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-flatten-pdf-intro");
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
        className="flp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="flp-fs__header">
          <h1 id="flp-fs-title" className="flp-fs__title">
            <span className="flp-fs__title-brand">{t("brand")}</span>
            <span className="flp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="flp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="flp-fs__stage" aria-hidden>
          <div className="flp-fs__scene">
            <div
              className="flp-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="flp-fs__card">
                <div className="flp-fs__badges">
                  <span className="flp-fs__badge flp-fs__badge--layers">{t("layersBadge")}</span>
                  <span className="flp-fs__arrow" />
                  <span className="flp-fs__badge flp-fs__badge--flat">{t("flatBadge")}</span>
                </div>

                <div className="flp-fs__stage-art">
                  <div className="flp-fs__stack">
                    <div className="flp-fs__layer flp-fs__layer--base">
                      <span className="flp-fs__layer-bar" />
                      <span className="flp-fs__layer-line" />
                      <span className="flp-fs__layer-line flp-fs__layer-line--short" />
                      <span className="flp-fs__layer-line" />
                    </div>
                    <div className="flp-fs__layer flp-fs__layer--form">
                      <span className="flp-fs__field" />
                      <span className="flp-fs__field flp-fs__field--wide" />
                      <span className="flp-fs__checkbox" />
                    </div>
                    <div className="flp-fs__layer flp-fs__layer--annot">
                      <span className="flp-fs__sticky" />
                      <span className="flp-fs__highlight" />
                      <span className="flp-fs__pen" />
                    </div>
                  </div>

                  <div className="flp-fs__press">
                    <span className="flp-fs__press-bar" />
                  </div>

                  <div className="flp-fs__result">
                    <span className="flp-fs__result-fold" />
                    <span className="flp-fs__result-mark">{t("pdfBadge")}</span>
                    <span className="flp-fs__result-title">{t("docTitle")}</span>
                    <span className="flp-fs__result-bar" />
                    <span className="flp-fs__result-line" />
                    <span className="flp-fs__result-line flp-fs__result-line--short" />
                    <span className="flp-fs__result-seal">{t("flatBadge")}</span>
                  </div>
                </div>

                <span className="flp-fs__ok">
                  <span className="flp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flp-fs__footer">
          <button type="button" className="flp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="flp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
