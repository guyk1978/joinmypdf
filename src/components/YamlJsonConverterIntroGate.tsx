"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./yaml-json-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type YamlJsonConverterIntroGateProps = {
  /** When false, children render immediately (non–yaml-json-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for YAML ↔ JSON Converter.
 * Split panes → parsing laser → YAML indent ↔ JSON braces + success.
 * Only runs inside the ToolModal CALC embed.
 */
export function YamlJsonConverterIntroGate({
  active = true,
  children,
}: YamlJsonConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("YamlJsonConverterLanding");
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

    document.documentElement.setAttribute("data-yaml-json-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-yaml-json-intro");
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
        className="yjc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="yjc-fs-title"
      >
        <header className="yjc-fs__header">
          <h1 id="yjc-fs-title" className="yjc-fs__title">
            <span className="yjc-fs__title-brand">{t("brand")}</span>
            <span className="yjc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="yjc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="yjc-fs__stage" aria-hidden>
          <div className="yjc-fs__scene">
            <div className="yjc-fs__workspace animation-workspace">
              <div className="yjc-fs__card">
                <div className="yjc-fs__badges">
                  <span className="yjc-fs__badge yjc-fs__badge--yaml">{t("yamlBadge")}</span>
                  <span className="yjc-fs__swap">{t("swapLabel")}</span>
                  <span className="yjc-fs__badge yjc-fs__badge--json">{t("jsonBadge")}</span>
                </div>

                <div className="yjc-fs__panes">
                  <div className="yjc-fs__pane yjc-fs__pane--yaml">
                    <p className="yjc-fs__code">
                      <span className="yjc-fs__tok yjc-fs__tok--key">name</span>
                      <span className="yjc-fs__tok yjc-fs__tok--colon">: </span>
                      <span className="yjc-fs__tok yjc-fs__tok--val">Ada</span>
                    </p>
                    <p className="yjc-fs__code">
                      <span className="yjc-fs__tok yjc-fs__tok--key">roles</span>
                      <span className="yjc-fs__tok yjc-fs__tok--colon">:</span>
                    </p>
                    <p className="yjc-fs__code">
                      <span className="yjc-fs__tok yjc-fs__tok--dash">- </span>
                      <span className="yjc-fs__tok yjc-fs__tok--val">eng</span>
                    </p>
                    <p className="yjc-fs__code">
                      <span className="yjc-fs__tok yjc-fs__tok--dash">- </span>
                      <span className="yjc-fs__tok yjc-fs__tok--val">ops</span>
                    </p>
                  </div>

                  <div className="yjc-fs__beam" />

                  <div className="yjc-fs__pane yjc-fs__pane--json">
                    <p className="yjc-fs__code">
                      <span className="yjc-fs__tok yjc-fs__tok--brace">{"{"}</span>
                    </p>
                    <p className="yjc-fs__code">
                      {"  "}
                      <span className="yjc-fs__tok yjc-fs__tok--str">&quot;name&quot;</span>
                      <span className="yjc-fs__tok yjc-fs__tok--colon">: </span>
                      <span className="yjc-fs__tok yjc-fs__tok--str">&quot;Ada&quot;</span>,
                    </p>
                    <p className="yjc-fs__code">
                      {"  "}
                      <span className="yjc-fs__tok yjc-fs__tok--str">&quot;roles&quot;</span>
                      <span className="yjc-fs__tok yjc-fs__tok--colon">: </span>
                      <span className="yjc-fs__tok yjc-fs__tok--brace">[</span>
                      <span className="yjc-fs__tok yjc-fs__tok--str">&quot;eng&quot;</span>,
                      <span className="yjc-fs__tok yjc-fs__tok--str">&quot;ops&quot;</span>
                      <span className="yjc-fs__tok yjc-fs__tok--brace">]</span>
                    </p>
                    <p className="yjc-fs__code">
                      <span className="yjc-fs__tok yjc-fs__tok--brace">{"}"}</span>
                    </p>
                  </div>
                </div>
              </div>

              <span className="yjc-fs__ok">
                <span className="yjc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="yjc-fs__footer">
          <button type="button" className="yjc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="yjc-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
