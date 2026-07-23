"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
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
 * Drive graphic + values scale MB → GB → TB with glowing unit badges.
 * Only runs inside the ToolModal CALC embed.
 */
export function StorageDataConverterIntroGate({
  active = true,
  children,
}: StorageDataConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
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
                <div className="sdc-fs__units">
                  <span className="sdc-fs__unit sdc-fs__unit--mb">{t("unitMb")}</span>
                  <span className="sdc-fs__pipe" />
                  <span className="sdc-fs__unit sdc-fs__unit--gb">{t("unitGb")}</span>
                  <span className="sdc-fs__pipe sdc-fs__pipe--late" />
                  <span className="sdc-fs__unit sdc-fs__unit--tb">{t("unitTb")}</span>
                </div>

                <div className="sdc-fs__preview">
                  <div className="sdc-fs__drive">
                    <span className="sdc-fs__drive-bay" />
                    <span className="sdc-fs__drive-bay" />
                    <span className="sdc-fs__drive-bay" />
                    <span className="sdc-fs__drive-led" />
                    <span className="sdc-fs__fill" />
                  </div>

                  <div className="sdc-fs__readout">
                    <span className="sdc-fs__value">
                      <span className="sdc-fs__num sdc-fs__num--a">1024</span>
                      <span className="sdc-fs__num sdc-fs__num--b">1</span>
                      <span className="sdc-fs__num sdc-fs__num--c">0.001</span>
                    </span>
                    <span className="sdc-fs__label">
                      <span className="sdc-fs__lbl sdc-fs__lbl--a">{t("unitMb")}</span>
                      <span className="sdc-fs__lbl sdc-fs__lbl--b">{t("unitGb")}</span>
                      <span className="sdc-fs__lbl sdc-fs__lbl--c">{t("unitTb")}</span>
                    </span>
                  </div>
                </div>
              </div>

              <span className="sdc-fs__ok">
                <span className="sdc-fs__check" />
                {t("success")}
              </span>
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
