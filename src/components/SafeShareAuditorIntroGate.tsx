"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./safe-share-auditor-landing.css";

type IntroPhase = "intro" | "workspace";

type SafeShareAuditorIntroGateProps = {
  /** When false, children render immediately (non–safe-to-share-auditor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Safe-to-Share PDF Auditor.
 * Scan beam detects sensitive spots → clears → Safe to Share compliance stamp.
 * Only runs inside the ToolModal CALC embed.
 */
export function SafeShareAuditorIntroGate({
  active = true,
  children,
}: SafeShareAuditorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("SafeShareAuditorLanding");
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

    document.documentElement.setAttribute("data-safe-share-auditor-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-safe-share-auditor-intro");
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
        className="ssa-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ssa-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ssa-fs__header">
          <h1 id="ssa-fs-title" className="ssa-fs__title">
            <span className="ssa-fs__title-brand">{t("brand")}</span>
            <span className="ssa-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ssa-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ssa-fs__stage" aria-hidden>
          <div className="ssa-fs__scene">
            <div className="ssa-fs__workspace animation-workspace">
              <div className="ssa-fs__card">
                <div className="ssa-fs__badges">
                  <span className="ssa-fs__badge ssa-fs__badge--scan">{t("scanBadge")}</span>
                  <span className="ssa-fs__badge ssa-fs__badge--safe">{t("safeBadge")}</span>
                </div>

                <div className="ssa-fs__preview">
                  <div className="ssa-fs__doc">
                    <span className="ssa-fs__line ssa-fs__line--title" />
                    <span className="ssa-fs__line" />
                    <span className="ssa-fs__hit ssa-fs__hit--1" />
                    <span className="ssa-fs__line ssa-fs__line--short" />
                    <span className="ssa-fs__line" />
                    <span className="ssa-fs__hit ssa-fs__hit--2" />
                    <span className="ssa-fs__line ssa-fs__line--mid" />
                    <span className="ssa-fs__hit ssa-fs__hit--3" />
                  </div>

                  <div className="ssa-fs__beam" />

                  <span className="ssa-fs__stamp">
                    <span className="ssa-fs__stamp-icon" />
                    {t("complianceBadge")}
                  </span>
                </div>
              </div>

              <span className="ssa-fs__ok">
                <span className="ssa-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ssa-fs__footer">
          <button type="button" className="ssa-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ssa-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
