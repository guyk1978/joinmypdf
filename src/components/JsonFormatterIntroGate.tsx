"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
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
 * Minified payload → beautify engine → indented tree + Validated → success.
 * Shows before the formatter workspace (embed modal and dedicated tool page).
 */
export function JsonFormatterIntroGate({
  active = true,
  children,
}: JsonFormatterIntroGateProps) {
  const introActive = active;
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
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
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
                <div className="jfm-fs__pipeline">
                  <div className="jfm-fs__pane jfm-fs__pane--mini">
                    <span className="jfm-fs__tag">{t("minifiedTag")}</span>
                    <div className="jfm-fs__mini-block">
                      <code className="jfm-fs__mini">{t("miniSample")}</code>
                      <span className="jfm-fs__laser" />
                    </div>
                  </div>

                  <div className="jfm-fs__engine">
                    <span className="jfm-fs__flow" />
                    <span className="jfm-fs__core" />
                    <span className="jfm-fs__badge">{t("schemaBadge")}</span>
                  </div>

                  <div className="jfm-fs__pane jfm-fs__pane--pretty">
                    <span className="jfm-fs__tag jfm-fs__tag--pretty">{t("prettyTag")}</span>
                    <pre className="jfm-fs__pretty">
                      <span className="jfm-fs__line jfm-fs__line--1">
                        <span className="jfm-fs__brace">{"{"}</span>
                      </span>
                      <span className="jfm-fs__line jfm-fs__line--2">
                        {"  "}
                        <span className="jfm-fs__key">&quot;ok&quot;</span>
                        <span className="jfm-fs__punct">: </span>
                        <span className="jfm-fs__bool">true</span>
                        <span className="jfm-fs__punct">,</span>
                      </span>
                      <span className="jfm-fs__line jfm-fs__line--3">
                        {"  "}
                        <span className="jfm-fs__key">&quot;id&quot;</span>
                        <span className="jfm-fs__punct">: </span>
                        <span className="jfm-fs__num">42</span>
                        <span className="jfm-fs__punct">,</span>
                      </span>
                      <span className="jfm-fs__line jfm-fs__line--4">
                        {"  "}
                        <span className="jfm-fs__key">&quot;name&quot;</span>
                        <span className="jfm-fs__punct">: </span>
                        <span className="jfm-fs__str">&quot;Ada&quot;</span>
                      </span>
                      <span className="jfm-fs__line jfm-fs__line--5">
                        <span className="jfm-fs__brace">{"}"}</span>
                      </span>
                    </pre>
                  </div>
                </div>

                <span className="jfm-fs__particle jfm-fs__particle--1" />
                <span className="jfm-fs__particle jfm-fs__particle--2" />
                <span className="jfm-fs__particle jfm-fs__particle--3" />

                <span className="jfm-fs__ok">
                  <span className="jfm-fs__check" />
                  {t("success")}
                </span>
              </div>
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
      return (
        <div
          className="jfm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
