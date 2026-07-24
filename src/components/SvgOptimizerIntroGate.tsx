"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./svg-optimizer-landing.css";

type IntroPhase = "intro" | "workspace";

type SvgOptimizerIntroGateProps = {
  /** When false, children render immediately (non–svg-optimizer tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for SVG Optimizer.
 * Uncompressed XML + nodes → laser minify → shrunk vector + size metrics.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function SvgOptimizerIntroGate({
  active = true,
  children,
}: SvgOptimizerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("SvgOptimizerLanding");
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

    document.documentElement.setAttribute("data-svg-optimizer-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-svg-optimizer-intro");
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
        className="svo-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="svo-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="svo-fs__header">
          <h1 id="svo-fs-title" className="svo-fs__title">
            <span className="svo-fs__title-brand">{t("brand")}</span>
            <span className="svo-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="svo-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="svo-fs__stage" aria-hidden>
          <div className="svo-fs__scene">
            <div className="svo-fs__workspace animation-workspace" data-splash-wide>
              <div className="svo-fs__engine">
                <div className="svo-fs__status-row">
                  <span className="svo-fs__pill svo-fs__pill--raw">{t("rawBadge")}</span>
                  <span className="svo-fs__status-line" />
                  <span className="svo-fs__pill svo-fs__pill--opt">{t("optBadge")}</span>
                </div>

                <div className="svo-fs__body">
                  {/* Left — uncompressed XML + node map */}
                  <div className="svo-fs__code">
                    <div className="svo-fs__code-lines">
                      <span className="svo-fs__line svo-fs__line--meta">{t("lineMeta")}</span>
                      <span className="svo-fs__line">{t("lineSvg")}</span>
                      <span className="svo-fs__line svo-fs__line--indent">{t("linePath")}</span>
                      <span className="svo-fs__line svo-fs__line--indent svo-fs__line--waste">{t("lineWaste")}</span>
                      <span className="svo-fs__line svo-fs__line--indent">{t("lineG")}</span>
                      <span className="svo-fs__line svo-fs__line--close">{t("lineClose")}</span>
                    </div>
                    <div className="svo-fs__nodes">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="svo-fs__laser" />
                  </div>

                  {/* Right — compressed preview + size metrics */}
                  <div className="svo-fs__out">
                    <div className="svo-fs__preview">
                      <svg
                        className="svo-fs__vector"
                        viewBox="0 0 80 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 58 L40 14 L68 58 Z"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <circle cx="40" cy="44" r="12" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>

                    <div className="svo-fs__metrics">
                      <div className="svo-fs__size">
                        <span className="svo-fs__size-from">{t("sizeFrom")}</span>
                        <span className="svo-fs__size-arrow" />
                        <span className="svo-fs__size-to">{t("sizeTo")}</span>
                      </div>
                      <span className="svo-fs__savings">{t("savings")}</span>
                    </div>

                    <div className="svo-fs__particles">
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

              <span className="svo-fs__ok">
                <span className="svo-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="svo-fs__footer">
          <button type="button" className="svo-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="svo-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
