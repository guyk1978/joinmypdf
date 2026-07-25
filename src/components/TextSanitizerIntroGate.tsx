"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./text-sanitizer-landing.css";


type TextSanitizerIntroGateProps = {
  /** When false, children render immediately (non–text-sanitizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Text Sanitizer.
 * Messy OCR pane → sanitization node + laser scrub → clean output → success.
 * Shows before the sanitizer workspace (embed modal and dedicated tool page).
 */
export function TextSanitizerIntroGate({
  active = true,
  children,
}: TextSanitizerIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-text-sanitizer-intro",
  });
  const t = useTranslations("TextSanitizerLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="tsn-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tsn-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="tsn-fs__header">
          <h1 id="tsn-fs-title" className="tsn-fs__title">
            <span className="tsn-fs__title-brand">{t("brand")}</span>
            <span className="tsn-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="tsn-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="tsn-fs__stage" aria-hidden>
          <div className="tsn-fs__scene">
            <div className="tsn-fs__workspace animation-workspace">
              <div className="tsn-fs__card">
                <div className="tsn-fs__pipeline">
                  <div className="tsn-fs__pane tsn-fs__pane--messy">
                    <span className="tsn-fs__tag">{t("messyTag")}</span>
                    <div className="tsn-fs__lines">
                      <span className="tsn-fs__line tsn-fs__line--broken">{t("messyLine1")}</span>
                      <span className="tsn-fs__line tsn-fs__line--spaced">{t("messyLine2")}</span>
                      <span className="tsn-fs__line tsn-fs__line--hyphen">{t("messyLine3")}</span>
                      <span className="tsn-fs__line tsn-fs__line--ghosts">
                        {t("messyLine4")}
                        <span className="tsn-fs__inv" />
                        <span className="tsn-fs__inv tsn-fs__inv--2" />
                        <span className="tsn-fs__inv tsn-fs__inv--3" />
                      </span>
                      <span className="tsn-fs__laser" />
                    </div>
                  </div>

                  <div className="tsn-fs__engine">
                    <span className="tsn-fs__flow" />
                    <span className="tsn-fs__core" />
                    <span className="tsn-fs__badge">{t("artifactsBadge")}</span>
                  </div>

                  <div className="tsn-fs__pane tsn-fs__pane--clean">
                    <span className="tsn-fs__tag tsn-fs__tag--clean">{t("cleanTag")}</span>
                    <div className="tsn-fs__lines">
                      <span className="tsn-fs__line tsn-fs__line--clean">{t("cleanLine1")}</span>
                      <span className="tsn-fs__line tsn-fs__line--clean tsn-fs__line--clean2">
                        {t("cleanLine2")}
                      </span>
                      <span className="tsn-fs__line tsn-fs__line--clean tsn-fs__line--clean3">
                        {t("cleanLine3")}
                      </span>
                      <span className="tsn-fs__line tsn-fs__line--clean tsn-fs__line--clean4">
                        {t("cleanLine4")}
                      </span>
                      <span className="tsn-fs__polish" />
                    </div>
                  </div>
                </div>

                <span className="tsn-fs__particle tsn-fs__particle--1" />
                <span className="tsn-fs__particle tsn-fs__particle--2" />
                <span className="tsn-fs__particle tsn-fs__particle--3" />
              </div>

              <span className="tsn-fs__ok">
                <span className="tsn-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="tsn-fs__footer">
          <button type="button" className="tsn-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="tsn-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
