"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./csv-markdown-converter-landing.css";


type CsvMarkdownConverterIntroGateProps = {
  /** When false, children render immediately (non–csv-to-markdown-table tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for CSV to Markdown Table.
 * Raw CSV → parse/format engine → pipe-delimited Markdown table → success.
 * Shows before the converter workspace (embed modal and dedicated tool page).
 */
export function CsvMarkdownConverterIntroGate({
  active = true,
  children,
}: CsvMarkdownConverterIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-csv-markdown-intro",
  });
  const t = useTranslations("CsvMarkdownLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="c2m-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="c2m-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="c2m-fs__header">
          <h1 id="c2m-fs-title" className="c2m-fs__title">
            <span className="c2m-fs__title-brand">{t("brand")}</span>
            <span className="c2m-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="c2m-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="c2m-fs__stage" aria-hidden>
          <div className="c2m-fs__scene">
            <div className="c2m-fs__workspace animation-workspace">
              <div className="c2m-fs__card">
                <div className="c2m-fs__pipeline">
                  <div className="c2m-fs__pane c2m-fs__pane--csv">
                    <span className="c2m-fs__tag">{t("csvTag")}</span>
                    <div className="c2m-fs__code">
                      <p className="c2m-fs__line c2m-fs__line--1">
                        <span className="c2m-fs__cell">id</span>
                        <span className="c2m-fs__comma">,</span>
                        <span className="c2m-fs__cell">name</span>
                        <span className="c2m-fs__comma">,</span>
                        <span className="c2m-fs__cell">role</span>
                      </p>
                      <p className="c2m-fs__line c2m-fs__line--2">
                        <span className="c2m-fs__cell">1</span>
                        <span className="c2m-fs__comma">,</span>
                        <span className="c2m-fs__cell">Ada</span>
                        <span className="c2m-fs__comma">,</span>
                        <span className="c2m-fs__cell">Engineer</span>
                      </p>
                      <p className="c2m-fs__line c2m-fs__line--3">
                        <span className="c2m-fs__cell">2</span>
                        <span className="c2m-fs__comma">,</span>
                        <span className="c2m-fs__cell">Ben</span>
                        <span className="c2m-fs__comma">,</span>
                        <span className="c2m-fs__cell">Designer</span>
                      </p>
                      <span className="c2m-fs__laser" />
                    </div>
                  </div>

                  <div className="c2m-fs__engine">
                    <span className="c2m-fs__flow" />
                    <span className="c2m-fs__core" />
                    <span className="c2m-fs__badge">{t("formatBadge")}</span>
                  </div>

                  <div className="c2m-fs__pane c2m-fs__pane--md">
                    <span className="c2m-fs__tag c2m-fs__tag--md">{t("mdTag")}</span>
                    <div className="c2m-fs__md">
                      <p className="c2m-fs__md-line c2m-fs__md-line--1">
                        <span className="c2m-fs__pipe">|</span> id{" "}
                        <span className="c2m-fs__pipe">|</span> name{" "}
                        <span className="c2m-fs__pipe">|</span> role{" "}
                        <span className="c2m-fs__pipe">|</span>
                      </p>
                      <p className="c2m-fs__md-line c2m-fs__md-line--2">
                        <span className="c2m-fs__pipe">|</span>
                        <span className="c2m-fs__hyphen">---</span>
                        <span className="c2m-fs__pipe">|</span>
                        <span className="c2m-fs__hyphen">------</span>
                        <span className="c2m-fs__pipe">|</span>
                        <span className="c2m-fs__hyphen">--------</span>
                        <span className="c2m-fs__pipe">|</span>
                      </p>
                      <p className="c2m-fs__md-line c2m-fs__md-line--3">
                        <span className="c2m-fs__pipe">|</span> 1{" "}
                        <span className="c2m-fs__pipe">|</span> Ada{" "}
                        <span className="c2m-fs__pipe">|</span> Engineer{" "}
                        <span className="c2m-fs__pipe">|</span>
                      </p>
                      <p className="c2m-fs__md-line c2m-fs__md-line--4">
                        <span className="c2m-fs__pipe">|</span> 2{" "}
                        <span className="c2m-fs__pipe">|</span> Ben{" "}
                        <span className="c2m-fs__pipe">|</span> Designer{" "}
                        <span className="c2m-fs__pipe">|</span>
                      </p>
                    </div>
                  </div>
                </div>

                <span className="c2m-fs__particle c2m-fs__particle--1" />
                <span className="c2m-fs__particle c2m-fs__particle--2" />
                <span className="c2m-fs__particle c2m-fs__particle--3" />

                <span className="c2m-fs__ok">
                  <span className="c2m-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="c2m-fs__footer">
          <button type="button" className="c2m-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="c2m-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
