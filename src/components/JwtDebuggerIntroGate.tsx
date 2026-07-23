"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./jwt-debugger-landing.css";

type IntroPhase = "intro" | "workspace";

type JwtDebuggerIntroGateProps = {
  /** When false, children render immediately (non–jwt-debugger tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for JWT Decoder Online.
 * Encoded token → verification laser → Header / Payload / Signature split + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function JwtDebuggerIntroGate({
  active = true,
  children,
}: JwtDebuggerIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("JwtDebuggerLanding");
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

    document.documentElement.setAttribute("data-jwt-debugger-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-jwt-debugger-intro");
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
        className="jwt-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jwt-fs-title"
      >
        <header className="jwt-fs__header">
          <h1 id="jwt-fs-title" className="jwt-fs__title">
            <span className="jwt-fs__title-brand">{t("brand")}</span>
            <span className="jwt-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="jwt-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="jwt-fs__stage" aria-hidden>
          <div className="jwt-fs__scene">
            <div className="jwt-fs__workspace animation-workspace">
              <div className="jwt-fs__card">
                <div className="jwt-fs__status">
                  <span className="jwt-fs__pill jwt-fs__pill--alg">{t("algBadge")}</span>
                  <span className="jwt-fs__pill jwt-fs__pill--safe">{t("safeBadge")}</span>
                </div>

                <div className="jwt-fs__token">
                  <span className="jwt-fs__seg jwt-fs__seg--h">eyJhbGci</span>
                  <span className="jwt-fs__dot">.</span>
                  <span className="jwt-fs__seg jwt-fs__seg--p">eyJzdWIi</span>
                  <span className="jwt-fs__dot">.</span>
                  <span className="jwt-fs__seg jwt-fs__seg--s">SflKxwRJ</span>
                  <div className="jwt-fs__laser" />
                </div>

                <div className="jwt-fs__parts">
                  <div className="jwt-fs__part jwt-fs__part--h">
                    <span className="jwt-fs__part-label">{t("header")}</span>
                    <span className="jwt-fs__part-val">HS256</span>
                  </div>
                  <div className="jwt-fs__part jwt-fs__part--p">
                    <span className="jwt-fs__part-label">{t("payload")}</span>
                    <span className="jwt-fs__part-val">sub · exp</span>
                  </div>
                  <div className="jwt-fs__part jwt-fs__part--s">
                    <span className="jwt-fs__part-label">{t("signature")}</span>
                    <span className="jwt-fs__part-val">••••</span>
                  </div>
                </div>
              </div>

              <span className="jwt-fs__ok">
                <span className="jwt-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="jwt-fs__footer">
          <button type="button" className="jwt-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="jwt-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
