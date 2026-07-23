"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./csv-to-json-landing.css";

type IntroPhase = "intro" | "workspace";

type CsvToJsonIntroGateProps = {
  /** When false, children render immediately (non–csv-to-json tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert CSV to JSON Online.
 * CSV grid → structuring beam → JSON braces/objects + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function CsvToJsonIntroGate({
  active = true,
  children,
}: CsvToJsonIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("CsvToJsonLanding");
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

    document.documentElement.setAttribute("data-csv-to-json-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-csv-to-json-intro");
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
        className="c2j-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="c2j-fs-title"
      >
        <header className="c2j-fs__header">
          <h1 id="c2j-fs-title" className="c2j-fs__title">
            <span className="c2j-fs__title-brand">{t("brand")}</span>
            <span className="c2j-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="c2j-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="c2j-fs__stage" aria-hidden>
          <div className="c2j-fs__scene">
            <div className="c2j-fs__workspace animation-workspace">
              <div className="c2j-fs__card">
                <div className="c2j-fs__badges">
                  <span className="c2j-fs__badge c2j-fs__badge--csv">{t("csvBadge")}</span>
                  <span className="c2j-fs__arrow">{t("arrowLabel")}</span>
                  <span className="c2j-fs__badge c2j-fs__badge--json">{t("jsonBadge")}</span>
                </div>

                <div className="c2j-fs__viewer">
                  <div className="c2j-fs__csv">
                    <div className="c2j-fs__row c2j-fs__row--head">
                      <span>id</span>
                      <span>name</span>
                      <span>role</span>
                    </div>
                    <div className="c2j-fs__row">
                      <span>1</span>
                      <span>Ada</span>
                      <span>eng</span>
                    </div>
                    <div className="c2j-fs__row">
                      <span>2</span>
                      <span>Grace</span>
                      <span>ops</span>
                    </div>
                  </div>

                  <div className="c2j-fs__json">
                    <p>
                      <span className="c2j-fs__brace">[</span>
                    </p>
                    <p>
                      {"  "}
                      <span className="c2j-fs__brace">{"{"}</span>
                      <span className="c2j-fs__key">&quot;id&quot;</span>:{" "}
                      <span className="c2j-fs__num">1</span>,
                      <span className="c2j-fs__key">&quot;name&quot;</span>:{" "}
                      <span className="c2j-fs__str">&quot;Ada&quot;</span>
                      <span className="c2j-fs__brace">{"}"}</span>,
                    </p>
                    <p>
                      {"  "}
                      <span className="c2j-fs__brace">{"{"}</span>
                      <span className="c2j-fs__key">&quot;id&quot;</span>:{" "}
                      <span className="c2j-fs__num">2</span>,
                      <span className="c2j-fs__key">&quot;name&quot;</span>:{" "}
                      <span className="c2j-fs__str">&quot;Grace&quot;</span>
                      <span className="c2j-fs__brace">{"}"}</span>
                    </p>
                    <p>
                      <span className="c2j-fs__brace">]</span>
                    </p>
                  </div>

                  <div className="c2j-fs__beam" />
                </div>
              </div>

              <span className="c2j-fs__ok">
                <span className="c2j-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="c2j-fs__footer">
          <button type="button" className="c2j-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="c2j-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
