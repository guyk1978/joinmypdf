"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
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
 * Nested JSON braces → parsing beam → tabular CSV grid + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function JsonCsvExplorerIntroGate({
  active = true,
  children,
}: JsonCsvExplorerIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
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
                <div className="jce-fs__badges">
                  <span className="jce-fs__badge jce-fs__badge--json">{t("jsonBadge")}</span>
                  <span className="jce-fs__swap">{t("swapLabel")}</span>
                  <span className="jce-fs__badge jce-fs__badge--csv">{t("csvBadge")}</span>
                </div>

                <div className="jce-fs__viewer">
                  <div className="jce-fs__json">
                    <p>
                      <span className="jce-fs__brace">[</span>
                    </p>
                    <p>
                      {"  "}
                      <span className="jce-fs__brace">{"{"}</span>
                      <span className="jce-fs__key">&quot;id&quot;</span>:{" "}
                      <span className="jce-fs__num">1</span>,
                      <span className="jce-fs__key">&quot;name&quot;</span>:{" "}
                      <span className="jce-fs__str">&quot;Ada&quot;</span>
                      <span className="jce-fs__brace">{"}"}</span>,
                    </p>
                    <p>
                      {"  "}
                      <span className="jce-fs__brace">{"{"}</span>
                      <span className="jce-fs__key">&quot;id&quot;</span>:{" "}
                      <span className="jce-fs__num">2</span>,
                      <span className="jce-fs__key">&quot;name&quot;</span>:{" "}
                      <span className="jce-fs__str">&quot;Grace&quot;</span>
                      <span className="jce-fs__brace">{"}"}</span>
                    </p>
                    <p>
                      <span className="jce-fs__brace">]</span>
                    </p>
                  </div>

                  <div className="jce-fs__csv">
                    <div className="jce-fs__row jce-fs__row--head">
                      <span>id</span>
                      <span>name</span>
                    </div>
                    <div className="jce-fs__row">
                      <span>1</span>
                      <span>Ada</span>
                    </div>
                    <div className="jce-fs__row">
                      <span>2</span>
                      <span>Grace</span>
                    </div>
                  </div>

                  <div className="jce-fs__beam" />
                </div>
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
      return <div className="jce-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
