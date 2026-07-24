"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./favicon-previewer-landing.css";

type IntroPhase = "intro" | "workspace";

type FaviconPreviewerIntroGateProps = {
  /** When false, children render immediately (non–favicon-previewer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Favicon Previewer Online.
 * Browser tab → laser sync → Desktop / Mobile / Taskbar device frames + Favicon Synchronized.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function FaviconPreviewerIntroGate({
  active = true,
  children,
}: FaviconPreviewerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("FaviconPreviewerLanding");
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

    document.documentElement.setAttribute("data-favicon-previewer-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-favicon-previewer-intro");
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
        className="fpv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fpv-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="fpv-fs__header">
          <h1 id="fpv-fs-title" className="fpv-fs__title">
            <span className="fpv-fs__title-brand">{t("brand")}</span>
            <span className="fpv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="fpv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="fpv-fs__stage" aria-hidden>
          <div className="fpv-fs__scene">
            <div className="fpv-fs__workspace animation-workspace">
              <div className="fpv-fs__card">
                <div className="fpv-fs__panels">
                  <div className="fpv-fs__panel fpv-fs__panel--source">
                    <span className="fpv-fs__tag fpv-fs__tag--source">{t("sourceTag")}</span>
                    <div className="fpv-fs__browser">
                      <span className="fpv-fs__chrome">
                        <span className="fpv-fs__dot" />
                        <span className="fpv-fs__dot" />
                        <span className="fpv-fs__dot" />
                      </span>
                      <div className="fpv-fs__tab">
                        <span className="fpv-fs__icon fpv-fs__icon--glow" />
                        <span className="fpv-fs__tab-title">{t("tabTitle")}</span>
                      </div>
                    </div>
                    <span className="fpv-fs__panel-hint">{t("sourceHint")}</span>
                  </div>

                  <div className="fpv-fs__pipe">
                    <span className="fpv-fs__pipe-line" />
                    <span className="fpv-fs__pipe-core" />
                    <span className="fpv-fs__laser" />
                  </div>

                  <div className="fpv-fs__devices">
                    <div className="fpv-fs__device fpv-fs__device--desktop">
                      <span className="fpv-fs__device-label">{t("desktopLabel")}</span>
                      <span className="fpv-fs__mini-tab">
                        <span className="fpv-fs__icon fpv-fs__icon--sm" />
                        <span className="fpv-fs__mini-title" />
                      </span>
                    </div>
                    <div className="fpv-fs__device fpv-fs__device--mobile">
                      <span className="fpv-fs__device-label">{t("mobileLabel")}</span>
                      <span className="fpv-fs__phone">
                        <span className="fpv-fs__icon fpv-fs__icon--md" />
                      </span>
                    </div>
                    <div className="fpv-fs__device fpv-fs__device--taskbar">
                      <span className="fpv-fs__device-label">{t("taskbarLabel")}</span>
                      <span className="fpv-fs__dock">
                        <span className="fpv-fs__icon fpv-fs__icon--xs" />
                        <span className="fpv-fs__dock-slot" />
                        <span className="fpv-fs__dock-slot" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="fpv-fs__pills">
                  <span className="fpv-fs__pill fpv-fs__pill--desktop">{t("desktopPill")}</span>
                  <span className="fpv-fs__pill fpv-fs__pill--mobile">{t("mobilePill")}</span>
                  <span className="fpv-fs__pill fpv-fs__pill--taskbar">{t("taskbarPill")}</span>
                </div>

                <span className="fpv-fs__particle fpv-fs__particle--1" />
                <span className="fpv-fs__particle fpv-fs__particle--2" />
                <span className="fpv-fs__particle fpv-fs__particle--3" />
                <span className="fpv-fs__particle fpv-fs__particle--4" />
              </div>

              <span className="fpv-fs__ok">
                <span className="fpv-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="fpv-fs__footer">
          <button type="button" className="fpv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="fpv-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
