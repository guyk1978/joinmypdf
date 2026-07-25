"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./storage-data-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type StorageDataConverterIntroGateProps = {
  /** When false, children render immediately (non–storage-data-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Storage & Data Unit Converter.
 * Drive graphic → scale engine → MB⇄GB⇄TB unit pills + byte tiers → success.
 * Shows before the converter workspace (embed modal and dedicated tool page).
 */
export function StorageDataConverterIntroGate({
  active = true,
  children,
}: StorageDataConverterIntroGateProps) {
  const introActive = active;
  const t = useTranslations("StorageDataConverterLanding");
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

    document.documentElement.setAttribute("data-storage-data-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-storage-data-converter-intro");
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
        className="sdc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sdc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="sdc-fs__header">
          <h1 id="sdc-fs-title" className="sdc-fs__title">
            <span className="sdc-fs__title-brand">{t("brand")}</span>
            <span className="sdc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="sdc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="sdc-fs__stage" aria-hidden>
          <div className="sdc-fs__scene">
            <div className="sdc-fs__workspace animation-workspace">
              <div className="sdc-fs__card">
                <div className="sdc-fs__pipeline">
                  <div className="sdc-fs__pane sdc-fs__pane--drive">
                    <span className="sdc-fs__tag">{t("driveTag")}</span>
                    <div className="sdc-fs__drive">
                      <span className="sdc-fs__drive-body">
                        <span className="sdc-fs__drive-bay" />
                        <span className="sdc-fs__drive-bay" />
                        <span className="sdc-fs__drive-bay" />
                        <span className="sdc-fs__drive-led" />
                        <span className="sdc-fs__fill" />
                      </span>
                      <span className="sdc-fs__drive-label">{t("driveLabel")}</span>
                      <span className="sdc-fs__laser" />
                    </div>
                  </div>

                  <div className="sdc-fs__engine">
                    <span className="sdc-fs__flow" />
                    <span className="sdc-fs__core" />
                    <span className="sdc-fs__badge">{t("modeBadge")}</span>
                  </div>

                  <div className="sdc-fs__pane sdc-fs__pane--scale">
                    <span className="sdc-fs__tag sdc-fs__tag--scale">{t("scaleTag")}</span>
                    <div className="sdc-fs__units">
                      <span className="sdc-fs__unit sdc-fs__unit--mb">{t("unitMb")}</span>
                      <span className="sdc-fs__swap">⇄</span>
                      <span className="sdc-fs__unit sdc-fs__unit--gb">{t("unitGb")}</span>
                      <span className="sdc-fs__swap sdc-fs__swap--late">⇄</span>
                      <span className="sdc-fs__unit sdc-fs__unit--tb">{t("unitTb")}</span>
                    </div>
                    <div className="sdc-fs__tiers">
                      <div className="sdc-fs__tier sdc-fs__tier--1">
                        <span className="sdc-fs__tier-val">1,024</span>
                        <span className="sdc-fs__tier-unit">{t("unitMb")}</span>
                      </div>
                      <div className="sdc-fs__tier sdc-fs__tier--2">
                        <span className="sdc-fs__tier-val">1</span>
                        <span className="sdc-fs__tier-unit">{t("unitGb")}</span>
                      </div>
                      <div className="sdc-fs__tier sdc-fs__tier--3">
                        <span className="sdc-fs__tier-val">0.001</span>
                        <span className="sdc-fs__tier-unit">{t("unitTb")}</span>
                      </div>
                      <div className="sdc-fs__tier sdc-fs__tier--4">
                        <span className="sdc-fs__tier-val">1,073,741,824</span>
                        <span className="sdc-fs__tier-unit">{t("unitBytes")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="sdc-fs__particle sdc-fs__particle--1" />
                <span className="sdc-fs__particle sdc-fs__particle--2" />
                <span className="sdc-fs__particle sdc-fs__particle--3" />

                <span className="sdc-fs__ok">
                  <span className="sdc-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sdc-fs__footer">
          <button type="button" className="sdc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="sdc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
