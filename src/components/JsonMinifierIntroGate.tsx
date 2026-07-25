"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./json-minifier-landing.css";


type JsonMinifierIntroGateProps = {
  /** When false, children render immediately (non–json-minifier tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free JSON Minifier Online.
 * Pretty indented JSON → compression engine → single-line payload + size saved.
 * Shows before the minifier workspace (embed modal and dedicated tool page).
 */
export function JsonMinifierIntroGate({
  active = true,
  children,
}: JsonMinifierIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-json-minifier-intro",
  });
  const t = useTranslations("JsonMinifierLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="jmn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jmn-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
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
                <div className="jmn-fs__pipeline">
                  <div className="jmn-fs__pane jmn-fs__pane--pretty">
                    <span className="jmn-fs__tag">{t("prettyTag")}</span>
                    <pre className="jmn-fs__pretty">
                      <span className="jmn-fs__line jmn-fs__line--1">
                        <span className="jmn-fs__brace">{"{"}</span>
                      </span>
                      <span className="jmn-fs__line jmn-fs__line--2">
                        {"  "}
                        <span className="jmn-fs__key">&quot;ok&quot;</span>
                        <span className="jmn-fs__punct">: </span>
                        <span className="jmn-fs__bool">true</span>
                        <span className="jmn-fs__punct">,</span>
                      </span>
                      <span className="jmn-fs__line jmn-fs__line--3">
                        {"  "}
                        <span className="jmn-fs__key">&quot;id&quot;</span>
                        <span className="jmn-fs__punct">: </span>
                        <span className="jmn-fs__num">42</span>
                        <span className="jmn-fs__punct">,</span>
                      </span>
                      <span className="jmn-fs__line jmn-fs__line--4">
                        {"  "}
                        <span className="jmn-fs__key">&quot;name&quot;</span>
                        <span className="jmn-fs__punct">: </span>
                        <span className="jmn-fs__str">&quot;Ada&quot;</span>
                      </span>
                      <span className="jmn-fs__line jmn-fs__line--5">
                        <span className="jmn-fs__brace">{"}"}</span>
                      </span>
                      <span className="jmn-fs__laser" />
                    </pre>
                  </div>

                  <div className="jmn-fs__engine">
                    <span className="jmn-fs__flow" />
                    <span className="jmn-fs__core" />
                    <span className="jmn-fs__badge">{t("sizeBadge")}</span>
                  </div>

                  <div className="jmn-fs__pane jmn-fs__pane--mini">
                    <span className="jmn-fs__tag jmn-fs__tag--mini">{t("minifiedTag")}</span>
                    <div className="jmn-fs__mini-block">
                      <code className="jmn-fs__mini">{t("miniSample")}</code>
                    </div>
                  </div>
                </div>

                <span className="jmn-fs__particle jmn-fs__particle--1" />
                <span className="jmn-fs__particle jmn-fs__particle--2" />
                <span className="jmn-fs__particle jmn-fs__particle--3" />

                <span className="jmn-fs__ok">
                  <span className="jmn-fs__check" />
                  {t("success")}
                </span>
              </div>
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
      return (
        <div
          className="jmn-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
