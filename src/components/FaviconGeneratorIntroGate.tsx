"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./favicon-generator-landing.css";

type IntroPhase = "intro" | "workspace";

type FaviconGeneratorIntroGateProps = {
  /** When false, children render immediately (non–favicon-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Favicon Generator.
 * Source SVG → fractal resampling → parallel multi-size pack streams.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function FaviconGeneratorIntroGate({
  active = true,
  children,
}: FaviconGeneratorIntroGateProps) {
  const introActive = active;
  const t = useTranslations("FaviconGeneratorLanding");
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

    document.documentElement.setAttribute("data-favicon-generator-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-favicon-generator-intro");
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
        className="fgen-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fgen-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="fgen-fs__header">
          <h1 id="fgen-fs-title" className="fgen-fs__title">
            <span className="fgen-fs__title-brand">{t("brand")}</span>
            <span className="fgen-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="fgen-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="fgen-fs__stage" aria-hidden>
          <div className="fgen-fs__scene">
            <div className="fgen-fs__workspace animation-workspace">
              <div className="fgen-fs__card">
                <div className="fgen-fs__pipeline">
                  <div className="fgen-fs__source">
                    <span className="fgen-fs__tag">{t("sourceTag")}</span>
                    <div className="fgen-fs__svg-mark">
                      <span className="fgen-fs__svg-shape fgen-fs__svg-shape--a" />
                      <span className="fgen-fs__svg-shape fgen-fs__svg-shape--b" />
                      <span className="fgen-fs__svg-shape fgen-fs__svg-shape--c" />
                      <span className="fgen-fs__svg-label">.SVG</span>
                    </div>
                    <span className="fgen-fs__source-hint">{t("sourceHint")}</span>
                  </div>

                  <div className="fgen-fs__processor">
                    <div className="fgen-fs__fractal">
                      <span className="fgen-fs__node fgen-fs__node--1" />
                      <span className="fgen-fs__node fgen-fs__node--2" />
                      <span className="fgen-fs__node fgen-fs__node--3" />
                      <span className="fgen-fs__node fgen-fs__node--4" />
                      <span className="fgen-fs__node fgen-fs__node--5" />
                      <span className="fgen-fs__node fgen-fs__node--6" />
                      <span className="fgen-fs__node fgen-fs__node--7" />
                      <span className="fgen-fs__node fgen-fs__node--8" />
                      <span className="fgen-fs__node fgen-fs__node--9" />
                      <span className="fgen-fs__beam fgen-fs__beam--h" />
                      <span className="fgen-fs__beam fgen-fs__beam--v" />
                      <span className="fgen-fs__beam fgen-fs__beam--d1" />
                      <span className="fgen-fs__beam fgen-fs__beam--d2" />
                      <span className="fgen-fs__core" />
                    </div>
                    <span className="fgen-fs__float-badge">{t("resampleBadge")}</span>
                  </div>

                  <div className="fgen-fs__outputs">
                    <span className="fgen-fs__tag fgen-fs__tag--out">{t("outputTag")}</span>
                    <div className="fgen-fs__cascade">
                      <span className="fgen-fs__out fgen-fs__out--32">
                        <span className="fgen-fs__out-icon" />
                        <span className="fgen-fs__out-size">32×32</span>
                      </span>
                      <span className="fgen-fs__out fgen-fs__out--48">
                        <span className="fgen-fs__out-icon" />
                        <span className="fgen-fs__out-size">48×48</span>
                      </span>
                      <span className="fgen-fs__out fgen-fs__out--64">
                        <span className="fgen-fs__out-icon" />
                        <span className="fgen-fs__out-size">64×64</span>
                      </span>
                      <span className="fgen-fs__out fgen-fs__out--180">
                        <span className="fgen-fs__out-icon" />
                        <span className="fgen-fs__out-size">180×180</span>
                      </span>
                    </div>
                    <div className="fgen-fs__formats">
                      <span className="fgen-fs__format fgen-fs__format--ico">.ICO</span>
                      <span className="fgen-fs__format fgen-fs__format--png">.PNG</span>
                      <span className="fgen-fs__format fgen-fs__format--svg">.SVG</span>
                    </div>
                  </div>
                </div>

                <span className="fgen-fs__particle fgen-fs__particle--1" />
                <span className="fgen-fs__particle fgen-fs__particle--2" />
                <span className="fgen-fs__particle fgen-fs__particle--3" />
                <span className="fgen-fs__particle fgen-fs__particle--4" />
              </div>

              <span className="fgen-fs__ok">
                <span className="fgen-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="fgen-fs__footer">
          <button type="button" className="fgen-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="fgen-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
