"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./image-dpi-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageDpiConverterIntroGateProps = {
  /** When false, children render immediately (non–image-dpi-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image DPI Converter.
 * Print preview + DPI panel → slider 72→300 → Print Ready.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function ImageDpiConverterIntroGate({
  active = true,
  children,
}: ImageDpiConverterIntroGateProps) {
  const introActive = active;
  const t = useTranslations("ImageDpiConverterLanding");
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

    document.documentElement.setAttribute("data-image-dpi-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-image-dpi-converter-intro");
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
        className="idc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="idc-fs__header">
          <h1 id="idc-fs-title" className="idc-fs__title">
            <span className="idc-fs__title-brand">{t("brand")}</span>
            <span className="idc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="idc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="idc-fs__stage" aria-hidden>
          <div className="idc-fs__scene">
            <div className="idc-fs__workspace animation-workspace" data-splash-wide>
              <div className="idc-fs__engine">
                <div className="idc-fs__status-row">
                  <span className="idc-fs__pill idc-fs__pill--screen">{t("screenBadge")}</span>
                  <span className="idc-fs__status-line" />
                  <span className="idc-fs__pill idc-fs__pill--print">{t("printBadge")}</span>
                </div>

                <div className="idc-fs__body">
                  {/* Left — print document preview */}
                  <div className="idc-fs__doc">
                    <div className="idc-fs__page">
                      <span className="idc-fs__page-header" />
                      <span className="idc-fs__page-line" />
                      <span className="idc-fs__page-line idc-fs__page-line--short" />
                      <span className="idc-fs__page-img" />
                      <span className="idc-fs__page-line" />
                      <span className="idc-fs__page-line idc-fs__page-line--mid" />
                      <span className="idc-fs__grid" />
                    </div>
                    <span className="idc-fs__doc-label">{t("docLabel")}</span>
                  </div>

                  {/* Right — DPI control panel */}
                  <div className="idc-fs__panel">
                    <div className="idc-fs__metric">
                      <span className="idc-fs__metric-label">{t("dpiLabel")}</span>
                      <span className="idc-fs__metric-value">
                        <span className="idc-fs__dpi idc-fs__dpi--72">{t("dpi72")}</span>
                        <span className="idc-fs__dpi idc-fs__dpi--150">{t("dpi150")}</span>
                        <span className="idc-fs__dpi idc-fs__dpi--300">{t("dpi300")}</span>
                      </span>
                    </div>

                    <div className="idc-fs__slider">
                      <span className="idc-fs__track" />
                      <span className="idc-fs__fill" />
                      <span className="idc-fs__thumb" />
                      <div className="idc-fs__ticks">
                        <span>72</span>
                        <span>150</span>
                        <span>300</span>
                      </div>
                    </div>

                    <div className="idc-fs__steps">
                      <span className="idc-fs__step idc-fs__step--a">{t("stepScreen")}</span>
                      <span className="idc-fs__step idc-fs__step--b">{t("stepMid")}</span>
                      <span className="idc-fs__step idc-fs__step--c">{t("stepPrint")}</span>
                    </div>

                    <div className="idc-fs__particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>

              <span className="idc-fs__ok">
                <span className="idc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="idc-fs__footer">
          <button type="button" className="idc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="idc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
