"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./protect-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type ProtectPdfIntroGateProps = {
  /** When false, children render immediately (non–protect-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Protect PDF with Password Online.
 * Password dots type in while a padlock snaps shut on a secure PDF card.
 * Only runs inside the ToolModal CALC embed.
 */
export function ProtectPdfIntroGate({
  active = true,
  children,
}: ProtectPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ProtectPdfLanding");
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

    document.documentElement.setAttribute("data-protect-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-protect-pdf-intro");
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
        className="prt-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prt-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="prt-fs__header">
          <h1 id="prt-fs-title" className="prt-fs__title">
            <span className="prt-fs__title-brand">{t("brand")}</span>
            <span className="prt-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="prt-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="prt-fs__stage" aria-hidden>
          <div className="prt-fs__scene">
            <div
              className="prt-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="prt-fs__card">
                <div className="prt-fs__badges">
                  <span className="prt-fs__badge prt-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="prt-fs__arrow" />
                  <span className="prt-fs__badge prt-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="prt-fs__stage-art">
                  <div className="prt-fs__doc">
                    <span className="prt-fs__fold" />
                    <span className="prt-fs__mark">PDF</span>
                    <span className="prt-fs__bar" />
                    <span className="prt-fs__line" />
                    <span className="prt-fs__line prt-fs__line--short" />
                    <span className="prt-fs__line" />
                    <span className="prt-fs__lock">
                      <span className="prt-fs__shackle" />
                      <span className="prt-fs__body" />
                    </span>
                  </div>

                  <div className="prt-fs__field">
                    <span className="prt-fs__field-label">{t("passwordLabel")}</span>
                    <span className="prt-fs__input">
                      <span className="prt-fs__dots">••••••••</span>
                      <span className="prt-fs__caret" />
                    </span>
                  </div>
                </div>

                <span className="prt-fs__ok">
                  <span className="prt-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="prt-fs__footer">
          <button type="button" className="prt-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="prt-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
