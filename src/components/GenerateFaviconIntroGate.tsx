"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./generate-favicon-landing.css";

type IntroPhase = "intro" | "workspace";

type GenerateFaviconIntroGateProps = {
  /** When false, children render immediately (non–generate-favicon tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free Favicon Generator Online.
 * Typography + color harmony → WCAG laser → multi-res .ICO/.PNG matrix.
 * Shows before the generator configuration workspace.
 */
export function GenerateFaviconIntroGate({
  active = true,
  children,
}: GenerateFaviconIntroGateProps) {
  const introActive = active;
  const t = useTranslations("GenerateFaviconLanding");
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

    document.documentElement.setAttribute("data-generate-favicon-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-generate-favicon-intro");
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
        className="gfv-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gfv-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="gfv-fs__header">
          <h1 id="gfv-fs-title" className="gfv-fs__title">
            <span className="gfv-fs__title-brand">{t("brand")}</span>
            <span className="gfv-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="gfv-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="gfv-fs__stage" aria-hidden>
          <div className="gfv-fs__scene">
            <div className="gfv-fs__workspace animation-workspace">
              <div className="gfv-fs__card">
                <div className="gfv-fs__panels">
                  <div className="gfv-fs__panel gfv-fs__panel--type">
                    <span className="gfv-fs__tag">{t("typeTag")}</span>
                    <div className="gfv-fs__type-field">
                      <span className="gfv-fs__type-char">J</span>
                      <span className="gfv-fs__type-cursor" />
                    </div>
                    <div className="gfv-fs__swatches" aria-hidden>
                      <span className="gfv-fs__swatch gfv-fs__swatch--brand" />
                      <span className="gfv-fs__swatch gfv-fs__swatch--bg" />
                      <span className="gfv-fs__swatch gfv-fs__swatch--fg" />
                    </div>
                    <span className="gfv-fs__harmony">{t("harmonyLabel")}</span>
                  </div>

                  <div className="gfv-fs__encode">
                    <span className="gfv-fs__encode-line" />
                    <span className="gfv-fs__encode-core" />
                    <span className="gfv-fs__laser" />
                    <span className="gfv-fs__wcag-badge">{t("wcagBadge")}</span>
                  </div>

                  <div className="gfv-fs__panel gfv-fs__panel--matrix">
                    <span className="gfv-fs__tag gfv-fs__tag--out">{t("matrixTag")}</span>
                    <div className="gfv-fs__matrix">
                      <span className="gfv-fs__cell gfv-fs__cell--16">
                        <span className="gfv-fs__glyph">J</span>
                        <span className="gfv-fs__cell-size">16×16</span>
                      </span>
                      <span className="gfv-fs__cell gfv-fs__cell--32">
                        <span className="gfv-fs__glyph">J</span>
                        <span className="gfv-fs__cell-size">32×32</span>
                      </span>
                      <span className="gfv-fs__cell gfv-fs__cell--64">
                        <span className="gfv-fs__glyph">J</span>
                        <span className="gfv-fs__cell-size">64×64</span>
                      </span>
                    </div>
                    <div className="gfv-fs__pack">
                      <span className="gfv-fs__pack-chip gfv-fs__pack-chip--ico">.ICO</span>
                      <span className="gfv-fs__pack-chip gfv-fs__pack-chip--png">.PNG</span>
                    </div>
                  </div>
                </div>

                <span className="gfv-fs__particle gfv-fs__particle--1" />
                <span className="gfv-fs__particle gfv-fs__particle--2" />
                <span className="gfv-fs__particle gfv-fs__particle--3" />
                <span className="gfv-fs__particle gfv-fs__particle--4" />
              </div>

              <span className="gfv-fs__ok">
                <span className="gfv-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="gfv-fs__footer">
          <button type="button" className="gfv-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="gfv-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
