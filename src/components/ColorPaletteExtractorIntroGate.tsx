"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./color-palette-extractor-landing.css";

type IntroPhase = "intro" | "workspace";

type ColorPaletteExtractorIntroGateProps = {
  /** When false, children render immediately (non–color-palette-extractor tools). */
  active?: boolean;
  children: ReactNode;
};

const SWATCHES = [
  { hex: "#38BDF8", cls: "cpe-fs__swatch--1" },
  { hex: "#FBBF24", cls: "cpe-fs__swatch--2" },
  { hex: "#F97316", cls: "cpe-fs__swatch--3" },
  { hex: "#22C55E", cls: "cpe-fs__swatch--4" },
  { hex: "#166534", cls: "cpe-fs__swatch--5" },
  { hex: "#1E3A8A", cls: "cpe-fs__swatch--6" },
] as const;

/**
 * One-way cinematic fullscreen splash for Color Palette Extractor.
 * Landscape scan → color swatches peel into a vertical palette + Palette Extracted.
 * Only runs inside the ToolModal CALC embed.
 */
export function ColorPaletteExtractorIntroGate({
  active = true,
  children,
}: ColorPaletteExtractorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ColorPaletteExtractorLanding");
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

    document.documentElement.setAttribute("data-color-palette-extractor-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-color-palette-extractor-intro");
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
        className="cpe-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpe-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="cpe-fs__header">
          <h1 id="cpe-fs-title" className="cpe-fs__title">
            <span className="cpe-fs__title-brand">{t("brand")}</span>
            <span className="cpe-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cpe-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cpe-fs__stage" aria-hidden>
          <div className="cpe-fs__scene">
            <div
              className="cpe-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="cpe-fs__card">
                <div className="cpe-fs__board">
                  <div className="cpe-fs__source">
                    <div className="cpe-fs__photo">
                      <span className="cpe-fs__sky" />
                      <span className="cpe-fs__sun" />
                      <span className="cpe-fs__cloud cpe-fs__cloud--a" />
                      <span className="cpe-fs__cloud cpe-fs__cloud--b" />
                      <span className="cpe-fs__hill cpe-fs__hill--far" />
                      <span className="cpe-fs__hill cpe-fs__hill--near" />
                      <span className="cpe-fs__scan" />
                    </div>
                  </div>

                  <div className="cpe-fs__bridge">
                    <span className="cpe-fs__trail" />
                    <div className="cpe-fs__particles">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="cpe-fs__palette">
                    {SWATCHES.map((swatch) => (
                      <div
                        key={swatch.hex}
                        className={`cpe-fs__swatch ${swatch.cls}`}
                        style={{ ["--swatch" as string]: swatch.hex }}
                      >
                        <span className="cpe-fs__dot" />
                        <span className="cpe-fs__hex">{swatch.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <span className="cpe-fs__ok">
                  <span className="cpe-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="cpe-fs__footer">
          <button type="button" className="cpe-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="cpe-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
