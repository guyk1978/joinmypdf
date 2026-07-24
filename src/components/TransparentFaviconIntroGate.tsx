"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./transparent-favicon-landing.css";

type IntroPhase = "intro" | "workspace";

type TransparentFaviconIntroGateProps = {
  /** When false, children render immediately (non–transparent-favicon tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Transparent Favicon Maker Online.
 * Solid-bg logo → AI transparency laser → checkerboard + browser tab + download pack.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function TransparentFaviconIntroGate({
  active = true,
  children,
}: TransparentFaviconIntroGateProps) {
  const introActive = active;
  const t = useTranslations("TransparentFaviconLanding");
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

    document.documentElement.setAttribute("data-transparent-favicon-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-transparent-favicon-intro");
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
        className="tfv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tfv-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="tfv-fs__header">
          <h1 id="tfv-fs-title" className="tfv-fs__title">
            <span className="tfv-fs__title-brand">{t("brand")}</span>
            <span className="tfv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="tfv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="tfv-fs__stage" aria-hidden>
          <div className="tfv-fs__scene">
            <div className="tfv-fs__workspace animation-workspace">
              <div className="tfv-fs__card">
                <div className="tfv-fs__pipeline">
                  <div className="tfv-fs__source">
                    <span className="tfv-fs__tag">{t("sourceTag")}</span>
                    <div className="tfv-fs__logo tfv-fs__logo--solid">
                      <span className="tfv-fs__logo-mark" />
                      <span className="tfv-fs__logo-bg" />
                    </div>
                    <span className="tfv-fs__source-hint">{t("sourceHint")}</span>
                  </div>

                  <div className="tfv-fs__engine">
                    <span className="tfv-fs__pipe-line" />
                    <span className="tfv-fs__engine-core" />
                    <span className="tfv-fs__laser" />
                    <span className="tfv-fs__ai-badge">{t("aiBadge")}</span>
                  </div>

                  <div className="tfv-fs__outputs">
                    <span className="tfv-fs__tag tfv-fs__tag--out">{t("outputTag")}</span>
                    <div className="tfv-fs__previews">
                      <div className="tfv-fs__preview tfv-fs__preview--checker">
                        <span className="tfv-fs__checker" />
                        <span className="tfv-fs__icon tfv-fs__icon--clear" />
                        <span className="tfv-fs__preview-label">32×32</span>
                      </div>
                      <div className="tfv-fs__preview tfv-fs__preview--tab">
                        <span className="tfv-fs__tab">
                          <span className="tfv-fs__icon tfv-fs__icon--tab" />
                          <span className="tfv-fs__tab-title" />
                        </span>
                        <span className="tfv-fs__preview-label">{t("tabLabel")}</span>
                      </div>
                      <div className="tfv-fs__preview tfv-fs__preview--pack">
                        <span className="tfv-fs__pack-badge">{t("packBadge")}</span>
                        <span className="tfv-fs__preview-label">{t("packLabel")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="tfv-fs__particle tfv-fs__particle--1" />
                <span className="tfv-fs__particle tfv-fs__particle--2" />
                <span className="tfv-fs__particle tfv-fs__particle--3" />
                <span className="tfv-fs__particle tfv-fs__particle--4" />
              </div>

              <span className="tfv-fs__ok">
                <span className="tfv-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="tfv-fs__footer">
          <button type="button" className="tfv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="tfv-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
