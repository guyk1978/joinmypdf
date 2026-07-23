"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./json-minifier-landing.css";

type IntroPhase = "intro" | "workspace";

type JsonMinifierIntroGateProps = {
  /** When false, children render immediately (non–json-minifier tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free JSON Minifier Online.
 * Pretty JSON → compression laser → single-line payload + size badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function JsonMinifierIntroGate({
  active = true,
  children,
}: JsonMinifierIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("JsonMinifierLanding");
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

    document.documentElement.setAttribute("data-json-minifier-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-json-minifier-intro");
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
        className="jmn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jmn-fs-title"
      >
        <header className="jmn-fs__header">
          <h1 id="jmn-fs-title" className="jmn-fs__title">
            <span className="jmn-fs__title-brand">{t("brand")}</span>
            <span className="jmn-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="jmn-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="jmn-fs__stage" aria-hidden>
          <div className="jmn-fs__scene">
            <div className="jmn-fs__workspace animation-workspace">
              <div className="jmn-fs__card">
                <div className="jmn-fs__toolbar">
                  <span className="jmn-fs__pill jmn-fs__pill--pretty">{t("pretty")}</span>
                  <span className="jmn-fs__pill jmn-fs__pill--mini">{t("minified")}</span>
                  <span className="jmn-fs__pill jmn-fs__pill--size">{t("sizeBadge")}</span>
                </div>

                <div className="jmn-fs__editor">
                  <pre className="jmn-fs__pretty">{`{
  "ok": true,
  "id": 42,
  "name": "Ada"
}`}</pre>
                  <p className="jmn-fs__mini">{`{"ok":true,"id":42,"name":"Ada"}`}</p>
                  <div className="jmn-fs__laser" />
                </div>
              </div>

              <span className="jmn-fs__ok">
                <span className="jmn-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="jmn-fs__footer">
          <button type="button" className="jmn-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="jmn-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
