"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./image-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageConverterIntroGateProps = {
  /** When false, children render immediately (non–image-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Converter.
 * Source format card → cycling pill (PNG→WEBP→JPG→AVIF) → converted badge + Converted.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function ImageConverterIntroGate({
  active = true,
  children,
}: ImageConverterIntroGateProps) {
  /** Run splash whenever this tool is active (modal embed or full tool page). */
  const introActive = active;
  const t = useTranslations("ImageConverterLanding");
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

    document.documentElement.setAttribute("data-image-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-image-converter-intro");
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
        className="icv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="icv-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="icv-fs__header">
          <h1 id="icv-fs-title" className="icv-fs__title">
            <span className="icv-fs__title-brand">{t("brand")}</span>
            <span className="icv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="icv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="icv-fs__stage" aria-hidden>
          <div className="icv-fs__scene">
            <div
              className="icv-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="icv-fs__card">
                <div className="icv-fs__badges">
                  <span className="icv-fs__badge icv-fs__badge--plain">{t("plainBadge")}</span>
                  <span className="icv-fs__arrow" />
                  <span className="icv-fs__badge icv-fs__badge--done">{t("doneBadge")}</span>
                </div>

                <div className="icv-fs__stage-art">
                  <div className="icv-fs__pills">
                    <span className="icv-fs__pill icv-fs__pill--png">{t("fmtPng")}</span>
                    <span className="icv-fs__pill icv-fs__pill--webp">{t("fmtWebp")}</span>
                    <span className="icv-fs__pill icv-fs__pill--jpg">{t("fmtJpg")}</span>
                    <span className="icv-fs__pill icv-fs__pill--avif">{t("fmtAvif")}</span>
                    <span className="icv-fs__selector" />
                  </div>

                  <div className="icv-fs__media">
                    <div className="icv-fs__source">
                      <span className="icv-fs__img" />
                      <span className="icv-fs__fmt icv-fs__fmt--src">{t("fmtPng")}</span>
                    </div>
                    <div className="icv-fs__target">
                      <span className="icv-fs__img icv-fs__img--out" />
                      <span className="icv-fs__fmt icv-fs__fmt--dst">{t("fmtWebp")}</span>
                    </div>
                    <div className="icv-fs__particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>

                <span className="icv-fs__ok">
                  <span className="icv-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="icv-fs__footer">
          <button type="button" className="icv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="icv-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
