"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./unlock-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type UnlockPdfIntroGateProps = {
  /** When false, children render immediately (non–unlock tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Unlock PDF Online.
 * Password dots type in while a locked padlock springs open on a red-badged PDF.
 * Only runs inside the ToolModal CALC embed.
 */
export function UnlockPdfIntroGate({
  active = true,
  children,
}: UnlockPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("UnlockPdfLanding");
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

    document.documentElement.setAttribute("data-unlock-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-unlock-pdf-intro");
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
        className="ulk-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ulk-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ulk-fs__header">
          <h1 id="ulk-fs-title" className="ulk-fs__title">
            <span className="ulk-fs__title-brand">{t("brand")}</span>
            <span className="ulk-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ulk-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ulk-fs__stage" aria-hidden>
          <div className="ulk-fs__scene">
            <div
              className="ulk-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="ulk-fs__card">
                <div className="ulk-fs__badges">
                  <span className="ulk-fs__badge ulk-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="ulk-fs__arrow" />
                  <span className="ulk-fs__badge ulk-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="ulk-fs__stage-art">
                  <div className="ulk-fs__doc">
                    <span className="ulk-fs__fold" />
                    <span className="ulk-fs__mark">{t("lockedMark")}</span>
                    <span className="ulk-fs__bar" />
                    <span className="ulk-fs__line" />
                    <span className="ulk-fs__line ulk-fs__line--short" />
                    <span className="ulk-fs__line" />
                    <span className="ulk-fs__lock">
                      <span className="ulk-fs__shackle" />
                      <span className="ulk-fs__body" />
                    </span>
                  </div>

                  <div className="ulk-fs__field">
                    <span className="ulk-fs__field-label">{t("passwordLabel")}</span>
                    <span className="ulk-fs__input">
                      <span className="ulk-fs__dots">••••••••</span>
                      <span className="ulk-fs__caret" />
                    </span>
                  </div>
                </div>

                <span className="ulk-fs__ok">
                  <span className="ulk-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ulk-fs__footer">
          <button type="button" className="ulk-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ulk-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
