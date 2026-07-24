"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./compare-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type ComparePdfIntroGateProps = {
  /** When false, children render immediately (non–compare-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Compare PDF.
 * A scanner beam reveals red removals and green additions across two side-by-side pages.
 * Only runs inside the ToolModal CALC embed.
 */
export function ComparePdfIntroGate({
  active = true,
  children,
}: ComparePdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ComparePdfLanding");
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

    document.documentElement.setAttribute("data-compare-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-compare-pdf-intro");
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
        className="cmp-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmp-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="cmp-fs__header">
          <h1 id="cmp-fs-title" className="cmp-fs__title">
            <span className="cmp-fs__title-brand">{t("brand")}</span>
            <span className="cmp-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cmp-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cmp-fs__stage" aria-hidden>
          <div className="cmp-fs__scene">
            <div
              className="cmp-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="cmp-fs__card">
                <div className="cmp-fs__badges">
                  <span className="cmp-fs__badge cmp-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="cmp-fs__arrow" />
                  <span className="cmp-fs__badge cmp-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="cmp-fs__stage-art">
                  <div className="cmp-fs__pair">
                    <div className="cmp-fs__doc cmp-fs__doc--left">
                      <span className="cmp-fs__fold" />
                      <span className="cmp-fs__label">{t("leftLabel")}</span>
                      <span className="cmp-fs__line" />
                      <span className="cmp-fs__line cmp-fs__line--short" />
                      <span className="cmp-fs__line" />
                      <span className="cmp-fs__diff cmp-fs__diff--removed">
                        {t("removed")}
                      </span>
                      <span className="cmp-fs__line cmp-fs__line--mid" />
                    </div>

                    <div className="cmp-fs__doc cmp-fs__doc--right">
                      <span className="cmp-fs__fold" />
                      <span className="cmp-fs__label">{t("rightLabel")}</span>
                      <span className="cmp-fs__line" />
                      <span className="cmp-fs__line cmp-fs__line--short" />
                      <span className="cmp-fs__line" />
                      <span className="cmp-fs__diff cmp-fs__diff--added">
                        {t("added")}
                      </span>
                      <span className="cmp-fs__line cmp-fs__line--mid" />
                    </div>

                    <span className="cmp-fs__beam" />
                  </div>

                  <div className="cmp-fs__progress">
                    <span className="cmp-fs__progress-track">
                      <span className="cmp-fs__progress-fill" />
                    </span>
                    <span className="cmp-fs__progress-label">{t("scanning")}</span>
                  </div>
                </div>

                <span className="cmp-fs__ok">
                  <span className="cmp-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="cmp-fs__footer">
          <button type="button" className="cmp-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="cmp-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
