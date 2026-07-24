"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./svg-to-favicon-landing.css";

type IntroPhase = "intro" | "workspace";

type SvgToFaviconIntroGateProps = {
  /** When false, children render immediately (non–svg-to-favicon tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free SVG to Favicon Converter Online.
 * Vector SVG node → path-rasterizer laser → multi-format favicon pack matrix.
 * Shows before the SVG upload workspace (embed modal and dedicated tool page).
 */
export function SvgToFaviconIntroGate({
  active = true,
  children,
}: SvgToFaviconIntroGateProps) {
  const introActive = active;
  const t = useTranslations("SvgToFaviconLanding");
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

    document.documentElement.setAttribute("data-svg-to-favicon-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-svg-to-favicon-intro");
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
        className="stf-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stf-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="stf-fs__header">
          <h1 id="stf-fs-title" className="stf-fs__title">
            <span className="stf-fs__title-brand">{t("brand")}</span>
            <span className="stf-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="stf-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="stf-fs__stage" aria-hidden>
          <div className="stf-fs__scene">
            <div className="stf-fs__workspace animation-workspace">
              <div className="stf-fs__card">
                <div className="stf-fs__pipeline">
                  <div className="stf-fs__source">
                    <span className="stf-fs__tag">{t("sourceTag")}</span>
                    <div className="stf-fs__svg-node">
                      <span className="stf-fs__code-line stf-fs__code-line--1" />
                      <span className="stf-fs__code-line stf-fs__code-line--2" />
                      <span className="stf-fs__code-line stf-fs__code-line--3" />
                      <span className="stf-fs__vector">
                        <span className="stf-fs__path stf-fs__path--a" />
                        <span className="stf-fs__path stf-fs__path--b" />
                        <span className="stf-fs__path stf-fs__path--c" />
                      </span>
                      <span className="stf-fs__ext">.SVG</span>
                    </div>
                    <span className="stf-fs__source-hint">{t("sourceHint")}</span>
                  </div>

                  <div className="stf-fs__rasterizer">
                    <span className="stf-fs__pipe-line" />
                    <span className="stf-fs__math-core" />
                    <span className="stf-fs__laser" />
                    <span className="stf-fs__opt-badge">{t("optimizeBadge")}</span>
                  </div>

                  <div className="stf-fs__pack">
                    <span className="stf-fs__tag stf-fs__tag--out">{t("packTag")}</span>
                    <div className="stf-fs__matrix">
                      <span className="stf-fs__cell stf-fs__cell--16">
                        <span className="stf-fs__glyph" />
                        <span className="stf-fs__cell-size">16×16</span>
                      </span>
                      <span className="stf-fs__cell stf-fs__cell--32">
                        <span className="stf-fs__glyph" />
                        <span className="stf-fs__cell-size">32×32</span>
                      </span>
                      <span className="stf-fs__cell stf-fs__cell--64">
                        <span className="stf-fs__glyph" />
                        <span className="stf-fs__cell-size">64×64</span>
                      </span>
                      <span className="stf-fs__cell stf-fs__cell--128">
                        <span className="stf-fs__glyph" />
                        <span className="stf-fs__cell-size">128×128</span>
                      </span>
                    </div>
                    <div className="stf-fs__formats">
                      <span className="stf-fs__format stf-fs__format--ico">.ICO</span>
                      <span className="stf-fs__format stf-fs__format--png">.PNG</span>
                    </div>
                  </div>
                </div>

                <span className="stf-fs__particle stf-fs__particle--1" />
                <span className="stf-fs__particle stf-fs__particle--2" />
                <span className="stf-fs__particle stf-fs__particle--3" />
                <span className="stf-fs__particle stf-fs__particle--4" />
              </div>

              <span className="stf-fs__ok">
                <span className="stf-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="stf-fs__footer">
          <button type="button" className="stf-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="stf-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
