"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./redact-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type RedactPdfIntroGateProps = {
  /** When false, children render immediately (non–redact tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Redact PDF Online.
 * Document text lines → black redaction bars slide over secrets → sanitized badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function RedactPdfIntroGate({
  active = true,
  children,
}: RedactPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("RedactPdfLanding");
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

    document.documentElement.setAttribute("data-redact-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-redact-pdf-intro");
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
        className="rdc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rdc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="rdc-fs__header">
          <h1 id="rdc-fs-title" className="rdc-fs__title">
            <span className="rdc-fs__title-brand">{t("brand")}</span>
            <span className="rdc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rdc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rdc-fs__stage" aria-hidden>
          <div className="rdc-fs__scene">
            <div className="rdc-fs__workspace animation-workspace">
              <div className="rdc-fs__card">
                <div className="rdc-fs__badges">
                  <span className="rdc-fs__badge rdc-fs__badge--sensitive">{t("sensitiveBadge")}</span>
                  <span className="rdc-fs__badge rdc-fs__badge--clean">{t("cleanBadge")}</span>
                </div>

                <div className="rdc-fs__doc">
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text">{t("lineName")}</span>
                    <span className="rdc-fs__bar rdc-fs__bar--1" />
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text">{t("lineAccount")}</span>
                    <span className="rdc-fs__bar rdc-fs__bar--2" />
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text rdc-fs__text--safe">{t("lineAddress")}</span>
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text">{t("lineSsn")}</span>
                    <span className="rdc-fs__bar rdc-fs__bar--3" />
                  </div>
                  <div className="rdc-fs__row">
                    <span className="rdc-fs__text rdc-fs__text--safe">{t("lineNotes")}</span>
                  </div>
                </div>
              </div>

              <span className="rdc-fs__ok">
                <span className="rdc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="rdc-fs__footer">
          <button type="button" className="rdc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="rdc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
