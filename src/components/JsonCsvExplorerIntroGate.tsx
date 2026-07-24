"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./json-csv-explorer-landing.css";

type IntroPhase = "intro" | "workspace";

type JsonCsvExplorerIntroGateProps = {
  /** When false, children render immediately (non–json-csv-explorer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for JSON ↔ CSV Explorer.
 * Nested JSON tree → Transformation Matrix mapping → CSV grid + success.
 * Shows before the explorer workspace (embed modal and dedicated tool page).
 */
export function JsonCsvExplorerIntroGate({
  active = true,
  children,
}: JsonCsvExplorerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("JsonCsvExplorerLanding");
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

    document.documentElement.setAttribute("data-json-csv-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-json-csv-intro");
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
        className="jce-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jce-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="jce-fs__header">
          <h1 id="jce-fs-title" className="jce-fs__title">
            <span className="jce-fs__title-brand">{t("brand")}</span>
            <span className="jce-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="jce-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="jce-fs__stage" aria-hidden>
          <div className="jce-fs__scene">
            <div className="jce-fs__workspace animation-workspace">
              <div className="jce-fs__card">
                <div className="jce-fs__pipeline">
                  <div className="jce-fs__json-pane">
                    <span className="jce-fs__tag">{t("jsonBadge")}</span>
                    <div className="jce-fs__tree">
                      <div className="jce-fs__tree-row jce-fs__tree-row--root">
                        <span className="jce-fs__brace">{"{"}</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--d1">
                        <span className="jce-fs__key">&quot;items&quot;</span>
                        <span className="jce-fs__colon">: [</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--d2">
                        <span className="jce-fs__brace">{"{"}</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--d3 jce-fs__tree-row--map">
                        <span className="jce-fs__key">&quot;name&quot;</span>
                        <span className="jce-fs__colon">: </span>
                        <span className="jce-fs__str">&quot;Ada&quot;</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--d3 jce-fs__tree-row--map2">
                        <span className="jce-fs__key">&quot;price&quot;</span>
                        <span className="jce-fs__colon">: </span>
                        <span className="jce-fs__num">12</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--d2">
                        <span className="jce-fs__brace">{"}"}</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--d1">
                        <span className="jce-fs__brace">]</span>
                      </div>
                      <div className="jce-fs__tree-row jce-fs__tree-row--root">
                        <span className="jce-fs__brace">{"}"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="jce-fs__matrix">
                    <span className="jce-fs__flow jce-fs__flow--1" />
                    <span className="jce-fs__flow jce-fs__flow--2" />
                    <span className="jce-fs__core" />
                    <span className="jce-fs__flatten">{t("flattenBadge")}</span>
                    <div className="jce-fs__maps">
                      <div className="jce-fs__map jce-fs__map--1">
                        <span className="jce-fs__path">$.items[*].name</span>
                        <span className="jce-fs__arrow">→</span>
                        <span className="jce-fs__col">&quot;Name&quot;</span>
                      </div>
                      <div className="jce-fs__map jce-fs__map--2">
                        <span className="jce-fs__path">$.items[*].price</span>
                        <span className="jce-fs__arrow">→</span>
                        <span className="jce-fs__col">&quot;Price&quot;</span>
                      </div>
                    </div>
                  </div>

                  <div className="jce-fs__csv-pane">
                    <span className="jce-fs__tag jce-fs__tag--csv">{t("csvBadge")}</span>
                    <div className="jce-fs__grid">
                      <div className="jce-fs__row jce-fs__row--head">
                        <span>Name</span>
                        <span>Price</span>
                      </div>
                      <div className="jce-fs__row jce-fs__row--data">
                        <span>Ada</span>
                        <span>12</span>
                      </div>
                      <div className="jce-fs__row jce-fs__row--data">
                        <span>Grace</span>
                        <span>9</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="jce-fs__particle jce-fs__particle--1" />
                <span className="jce-fs__particle jce-fs__particle--2" />
                <span className="jce-fs__particle jce-fs__particle--3" />
              </div>

              <span className="jce-fs__ok">
                <span className="jce-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="jce-fs__footer">
          <button type="button" className="jce-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="jce-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
