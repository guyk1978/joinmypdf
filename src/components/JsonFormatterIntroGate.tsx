"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./json-formatter-landing.css";

type IntroPhase = "intro" | "workspace";

type JsonFormatterIntroGateProps = {
  /** When false, children render immediately (non–json-formatter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free JSON Formatter & Validator.
 * Minified JSON → indent expand beam → pretty-print + Valid badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function JsonFormatterIntroGate({
  active = true,
  children,
}: JsonFormatterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("JsonFormatterLanding");
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

    document.documentElement.setAttribute("data-json-formatter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-json-formatter-intro");
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
        className="jfm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jfm-fs-title"
      >
        <header className="jfm-fs__header">
          <h1 id="jfm-fs-title" className="jfm-fs__title">
            <span className="jfm-fs__title-brand">{t("brand")}</span>
            <span className="jfm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="jfm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="jfm-fs__stage" aria-hidden>
          <div className="jfm-fs__scene">
            <div className="jfm-fs__workspace animation-workspace">
              <div className="jfm-fs__card">
                <div className="jfm-fs__toolbar">
                  <span className="jfm-fs__pill jfm-fs__pill--mini">{t("minified")}</span>
                  <span className="jfm-fs__pill jfm-fs__pill--pretty">{t("pretty")}</span>
                  <span className="jfm-fs__pill jfm-fs__pill--valid">{t("valid")}</span>
                </div>

                <div className="jfm-fs__editor">
                  <div className="jfm-fs__guides" />
                  <p className="jfm-fs__mini">{`{"ok":true,"id":42,"name":"Ada"}`}</p>
                  <pre className="jfm-fs__pretty">{`{
  "ok": true,
  "id": 42,
  "name": "Ada"
}`}</pre>
                  <div className="jfm-fs__beam" />
                </div>
              </div>

              <span className="jfm-fs__ok">
                <span className="jfm-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="jfm-fs__footer">
          <button type="button" className="jfm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="jfm-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
