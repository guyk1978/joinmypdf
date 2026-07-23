"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
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
 * JSON braces → structuring beam → spreadsheet CSV grid + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function JsonToCsvIntroGate({
  active = true,
  children,
}: JsonToCsvIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
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
                <div className="j2c-fs__badges">
                  <span className="j2c-fs__badge j2c-fs__badge--json">{t("jsonBadge")}</span>
                  <span className="j2c-fs__arrow">{t("arrowLabel")}</span>
                  <span className="j2c-fs__badge j2c-fs__badge--csv">{t("csvBadge")}</span>
                </div>

                <div className="j2c-fs__viewer">
                  <div className="j2c-fs__json">
                    <p>
                      <span className="j2c-fs__brace">[</span>
                    </p>
                    <p>
                      {"  "}
                      <span className="j2c-fs__brace">{"{"}</span>
                      <span className="j2c-fs__key">&quot;id&quot;</span>:{" "}
                      <span className="j2c-fs__num">1</span>,
                      <span className="j2c-fs__key">&quot;name&quot;</span>:{" "}
                      <span className="j2c-fs__str">&quot;Ada&quot;</span>
                      <span className="j2c-fs__brace">{"}"}</span>,
                    </p>
                    <p>
                      {"  "}
                      <span className="j2c-fs__brace">{"{"}</span>
                      <span className="j2c-fs__key">&quot;id&quot;</span>:{" "}
                      <span className="j2c-fs__num">2</span>,
                      <span className="j2c-fs__key">&quot;name&quot;</span>:{" "}
                      <span className="j2c-fs__str">&quot;Grace&quot;</span>
                      <span className="j2c-fs__brace">{"}"}</span>
                    </p>
                    <p>
                      <span className="j2c-fs__brace">]</span>
                    </p>
                  </div>

                  <div className="j2c-fs__csv">
                    <div className="j2c-fs__row j2c-fs__row--head">
                      <span>id</span>
                      <span>name</span>
                    </div>
                    <div className="j2c-fs__row">
                      <span>1</span>
                      <span>Ada</span>
                    </div>
                    <div className="j2c-fs__row">
                      <span>2</span>
                      <span>Grace</span>
                    </div>
                  </div>

                  <div className="j2c-fs__beam" />
                </div>
              </div>

              <span className="j2c-fs__ok">
                <span className="j2c-fs__check" />
                {t("success")}
              </span>
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
      return <div className="j2c-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
