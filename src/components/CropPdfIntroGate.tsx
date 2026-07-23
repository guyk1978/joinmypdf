"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./crop-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type CropPdfIntroGateProps = {
  /** When false, children render immediately (non–crop-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Crop PDF Online.
 * Page with wide margins → crop handles slide inward → trimmed core content.
 * Only runs inside the ToolModal CALC embed.
 */
export function CropPdfIntroGate({
  active = true,
  children,
}: CropPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("CropPdfLanding");
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

    document.documentElement.setAttribute("data-crop-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-crop-pdf-intro");
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
        className="cpf-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpf-fs-title"
      >
        <header className="cpf-fs__header">
          <h1 id="cpf-fs-title" className="cpf-fs__title">
            <span className="cpf-fs__title-brand">{t("brand")}</span>
            <span className="cpf-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cpf-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cpf-fs__stage" aria-hidden>
          <div className="cpf-fs__scene">
            <div className="cpf-fs__workspace animation-workspace">
              <div className="cpf-fs__card">
                <div className="cpf-fs__badges">
                  <span className="cpf-fs__badge cpf-fs__badge--before">{t("dimBefore")}</span>
                  <span className="cpf-fs__badge cpf-fs__badge--after">{t("dimAfter")}</span>
                </div>

                <div className="cpf-fs__page">
                  <div className="cpf-fs__margins" />
                  <div className="cpf-fs__content">
                    <span className="cpf-fs__line cpf-fs__line--title" />
                    <span className="cpf-fs__line" />
                    <span className="cpf-fs__line cpf-fs__line--short" />
                    <span className="cpf-fs__line" />
                    <span className="cpf-fs__line cpf-fs__line--mid" />
                    <span className="cpf-fs__line" />
                  </div>

                  <div className="cpf-fs__crop">
                    <span className="cpf-fs__bound cpf-fs__bound--t" />
                    <span className="cpf-fs__bound cpf-fs__bound--r" />
                    <span className="cpf-fs__bound cpf-fs__bound--b" />
                    <span className="cpf-fs__bound cpf-fs__bound--l" />
                    <span className="cpf-fs__handle cpf-fs__handle--nw" />
                    <span className="cpf-fs__handle cpf-fs__handle--ne" />
                    <span className="cpf-fs__handle cpf-fs__handle--sw" />
                    <span className="cpf-fs__handle cpf-fs__handle--se" />
                  </div>
                </div>
              </div>

              <span className="cpf-fs__ok">
                <span className="cpf-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="cpf-fs__footer">
          <button type="button" className="cpf-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="cpf-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
