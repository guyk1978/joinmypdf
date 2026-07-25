"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./yaml-json-converter-landing.css";


type YamlJsonConverterIntroGateProps = {
  /** When false, children render immediately (non–yaml-json-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for YAML ↔ JSON Converter.
 * Indented YAML → bi-directional engine → braced JSON → success.
 * Shows before the converter workspace (embed modal and dedicated tool page).
 */
export function YamlJsonConverterIntroGate({
  active = true,
  children,
}: YamlJsonConverterIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-yaml-json-intro",
  });
  const t = useTranslations("YamlJsonConverterLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="yjc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="yjc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
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
                <div className="yjc-fs__pipeline">
                  <div className="yjc-fs__pane yjc-fs__pane--yaml">
                    <span className="yjc-fs__tag">{t("yamlTag")}</span>
                    <div className="yjc-fs__code">
                      <p className="yjc-fs__line yjc-fs__line--1">
                        <span className="yjc-fs__key">name</span>
                        <span className="yjc-fs__colon">: </span>
                        <span className="yjc-fs__val">Ada</span>
                      </p>
                      <p className="yjc-fs__line yjc-fs__line--2">
                        <span className="yjc-fs__key">roles</span>
                        <span className="yjc-fs__colon">:</span>
                      </p>
                      <p className="yjc-fs__line yjc-fs__line--3">
                        <span className="yjc-fs__dash">- </span>
                        <span className="yjc-fs__val">eng</span>
                      </p>
                      <p className="yjc-fs__line yjc-fs__line--4">
                        <span className="yjc-fs__dash">- </span>
                        <span className="yjc-fs__val">ops</span>
                      </p>
                      <span className="yjc-fs__laser" />
                    </div>
                  </div>

                  <div className="yjc-fs__engine">
                    <span className="yjc-fs__flow" />
                    <span className="yjc-fs__core" aria-hidden>
                      <span className="yjc-fs__core-swap">↔</span>
                    </span>
                    <span className="yjc-fs__badge">{t("engineBadge")}</span>
                  </div>

                  <div className="yjc-fs__pane yjc-fs__pane--json">
                    <span className="yjc-fs__tag yjc-fs__tag--json">{t("jsonTag")}</span>
                    <div className="yjc-fs__json">
                      <p className="yjc-fs__jline yjc-fs__jline--1">
                        <span className="yjc-fs__brace">{"{"}</span>
                      </p>
                      <p className="yjc-fs__jline yjc-fs__jline--2">
                        {"  "}
                        <span className="yjc-fs__str">&quot;name&quot;</span>
                        <span className="yjc-fs__colon">: </span>
                        <span className="yjc-fs__str">&quot;Ada&quot;</span>,
                      </p>
                      <p className="yjc-fs__jline yjc-fs__jline--3">
                        {"  "}
                        <span className="yjc-fs__str">&quot;roles&quot;</span>
                        <span className="yjc-fs__colon">: </span>
                        <span className="yjc-fs__brace">[</span>
                        <span className="yjc-fs__str">&quot;eng&quot;</span>,{" "}
                        <span className="yjc-fs__str">&quot;ops&quot;</span>
                        <span className="yjc-fs__brace">]</span>
                      </p>
                      <p className="yjc-fs__jline yjc-fs__jline--4">
                        <span className="yjc-fs__brace">{"}"}</span>
                      </p>
                      <div className="yjc-fs__raw">{t("jsonSample")}</div>
                    </div>
                  </div>
                </div>

                <span className="yjc-fs__particle yjc-fs__particle--1" />
                <span className="yjc-fs__particle yjc-fs__particle--2" />
                <span className="yjc-fs__particle yjc-fs__particle--3" />

                <span className="yjc-fs__ok">
                  <span className="yjc-fs__check" />
                  {t("success")}
                </span>
              </div>
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
      return (
        <div
          className="yjc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
