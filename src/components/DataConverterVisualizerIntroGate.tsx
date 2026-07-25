"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./data-converter-visualizer-landing.css";


type DataConverterVisualizerIntroGateProps = {
  /** When false, children render immediately (non–data-converter-visualizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Universal Data Converter & Visualizer Online.
 * Raw multi-format payload → universal parser engine → node-graph + output → success.
 * Shows before the converter workspace (dedicated tool page).
 */
export function DataConverterVisualizerIntroGate({
  active = true,
  children,
}: DataConverterVisualizerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-udc-intro",
  });
  const t = useTranslations("DataConverterVisualizerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="udc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="udc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="udc-fs__header">
          <h1 id="udc-fs-title" className="udc-fs__title">
            <span className="udc-fs__title-brand">{t("brand")}</span>
            <span className="udc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="udc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="udc-fs__stage" aria-hidden>
          <div className="udc-fs__scene">
            <div className="udc-fs__workspace animation-workspace">
              <div className="udc-fs__card">
                <div className="udc-fs__pipeline">
                  <div className="udc-fs__pane udc-fs__pane--raw">
                    <span className="udc-fs__tag">{t("rawTag")}</span>
                    <div className="udc-fs__formats">
                      <span className="udc-fs__fmt udc-fs__fmt--json">JSON</span>
                      <span className="udc-fs__fmt udc-fs__fmt--yaml">YAML</span>
                      <span className="udc-fs__fmt udc-fs__fmt--csv">CSV</span>
                      <span className="udc-fs__fmt udc-fs__fmt--xml">XML</span>
                    </div>
                    <div className="udc-fs__code">
                      <p className="udc-fs__line udc-fs__line--1">
                        <span className="udc-fs__brace">{"{"}</span>
                      </p>
                      <p className="udc-fs__line udc-fs__line--2">
                        {"  "}
                        <span className="udc-fs__key">&quot;user&quot;</span>
                        <span className="udc-fs__colon">: </span>
                        <span className="udc-fs__brace">{"{"}</span>
                      </p>
                      <p className="udc-fs__line udc-fs__line--3">
                        {"    "}
                        <span className="udc-fs__key">&quot;name&quot;</span>
                        <span className="udc-fs__colon">: </span>
                        <span className="udc-fs__str">&quot;Ada&quot;</span>,
                      </p>
                      <p className="udc-fs__line udc-fs__line--4">
                        {"    "}
                        <span className="udc-fs__key">&quot;roles&quot;</span>
                        <span className="udc-fs__colon">: </span>
                        <span className="udc-fs__brace">[</span>
                        <span className="udc-fs__str">&quot;eng&quot;</span>
                        <span className="udc-fs__brace">]</span>
                      </p>
                      <p className="udc-fs__line udc-fs__line--5">
                        {"  "}
                        <span className="udc-fs__brace">{"}"}</span>
                      </p>
                      <p className="udc-fs__line udc-fs__line--6">
                        <span className="udc-fs__brace">{"}"}</span>
                      </p>
                      <span className="udc-fs__laser" />
                    </div>
                  </div>

                  <div className="udc-fs__engine">
                    <span className="udc-fs__flow" />
                    <span className="udc-fs__core" />
                    <span className="udc-fs__badge">{t("engineBadge")}</span>
                  </div>

                  <div className="udc-fs__pane udc-fs__pane--viz">
                    <span className="udc-fs__tag udc-fs__tag--viz">{t("vizTag")}</span>
                    <div className="udc-fs__graph">
                      <span className="udc-fs__node udc-fs__node--root">user</span>
                      <span className="udc-fs__edge udc-fs__edge--1" />
                      <span className="udc-fs__edge udc-fs__edge--2" />
                      <span className="udc-fs__node udc-fs__node--name">name</span>
                      <span className="udc-fs__node udc-fs__node--roles">roles</span>
                      <span className="udc-fs__node udc-fs__node--leaf">Ada</span>
                      <span className="udc-fs__node udc-fs__node--arr">[eng]</span>
                    </div>
                    <div className="udc-fs__out">{t("outSample")}</div>
                  </div>
                </div>

                <span className="udc-fs__particle udc-fs__particle--1" />
                <span className="udc-fs__particle udc-fs__particle--2" />
                <span className="udc-fs__particle udc-fs__particle--3" />

                <span className="udc-fs__ok">
                  <span className="udc-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="udc-fs__footer">
          <button type="button" className="udc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="udc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
