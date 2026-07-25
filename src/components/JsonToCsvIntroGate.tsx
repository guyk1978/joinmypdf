"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./json-to-csv-landing.css";

type IntroPhase = "intro" | "workspace";

type JsonToCsvIntroGateProps = {
  /** When false, children render immediately (non–json-to-csv tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert JSON to CSV Online.
 * JSON tree → flatten/parse engine → spreadsheet CSV rows → success.
 * Shows before the converter workspace (embed modal and dedicated tool page).
 */
export function JsonToCsvIntroGate({
  active = true,
  children,
}: JsonToCsvIntroGateProps) {
  const introActive = active;
  const t = useTranslations("JsonToCsvLanding");
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

    document.documentElement.setAttribute("data-json-to-csv-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-json-to-csv-intro");
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
        className="j2c-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="j2c-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="j2c-fs__header">
          <h1 id="j2c-fs-title" className="j2c-fs__title">
            <span className="j2c-fs__title-brand">{t("brand")}</span>
            <span className="j2c-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="j2c-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="j2c-fs__stage" aria-hidden>
          <div className="j2c-fs__scene">
            <div className="j2c-fs__workspace animation-workspace">
              <div className="j2c-fs__card">
                <div className="j2c-fs__pipeline">
                  <div className="j2c-fs__pane j2c-fs__pane--json">
                    <span className="j2c-fs__tag">{t("jsonTag")}</span>
                    <div className="j2c-fs__json">
                      <p className="j2c-fs__line j2c-fs__line--1">
                        <span className="j2c-fs__brace">[</span>
                      </p>
                      <p className="j2c-fs__line j2c-fs__line--2">
                        {"  "}
                        <span className="j2c-fs__brace">{"{"}</span>
                        <span className="j2c-fs__key">&quot;id&quot;</span>:{" "}
                        <span className="j2c-fs__num">1</span>,{" "}
                        <span className="j2c-fs__key">&quot;name&quot;</span>:{" "}
                        <span className="j2c-fs__str">&quot;Data&quot;</span>,{" "}
                        <span className="j2c-fs__key">&quot;value&quot;</span>:{" "}
                        <span className="j2c-fs__num">100</span>
                        <span className="j2c-fs__brace">{"}"}</span>,
                      </p>
                      <p className="j2c-fs__line j2c-fs__line--3">
                        {"  "}
                        <span className="j2c-fs__brace">{"{"}</span>
                        <span className="j2c-fs__key">&quot;id&quot;</span>:{" "}
                        <span className="j2c-fs__num">2</span>,{" "}
                        <span className="j2c-fs__key">&quot;name&quot;</span>:{" "}
                        <span className="j2c-fs__str">&quot;Grace&quot;</span>,{" "}
                        <span className="j2c-fs__key">&quot;value&quot;</span>:{" "}
                        <span className="j2c-fs__num">42</span>
                        <span className="j2c-fs__brace">{"}"}</span>
                      </p>
                      <p className="j2c-fs__line j2c-fs__line--4">
                        <span className="j2c-fs__brace">]</span>
                      </p>
                      <span className="j2c-fs__laser" />
                    </div>
                  </div>

                  <div className="j2c-fs__engine">
                    <span className="j2c-fs__flow" />
                    <span className="j2c-fs__core" />
                    <span className="j2c-fs__badge">{t("delimiterBadge")}</span>
                  </div>

                  <div className="j2c-fs__pane j2c-fs__pane--csv">
                    <span className="j2c-fs__tag j2c-fs__tag--csv">{t("csvTag")}</span>
                    <div className="j2c-fs__grid">
                      <div className="j2c-fs__row j2c-fs__row--head">
                        <span>{t("colId")}</span>
                        <span>{t("colName")}</span>
                        <span>{t("colValue")}</span>
                      </div>
                      <div className="j2c-fs__row j2c-fs__row--1">
                        <span>1</span>
                        <span>Data</span>
                        <span>100</span>
                      </div>
                      <div className="j2c-fs__row j2c-fs__row--2">
                        <span>2</span>
                        <span>Grace</span>
                        <span>42</span>
                      </div>
                      <div className="j2c-fs__raw">{t("csvSample")}</div>
                    </div>
                  </div>
                </div>

                <span className="j2c-fs__particle j2c-fs__particle--1" />
                <span className="j2c-fs__particle j2c-fs__particle--2" />
                <span className="j2c-fs__particle j2c-fs__particle--3" />

                <span className="j2c-fs__ok">
                  <span className="j2c-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="j2c-fs__footer">
          <button type="button" className="j2c-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="j2c-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
