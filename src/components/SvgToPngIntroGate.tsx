"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./svg-to-png-landing.css";

type IntroPhase = "intro" | "workspace";

type SvgToPngIntroGateProps = {
  /** When false, children render immediately (non–svg-to-png tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for SVG to PNG.
 * Side-by-side vector node rig → multi-beam laser rasterization → hi-fi PNG.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function SvgToPngIntroGate({
  active = true,
  children,
}: SvgToPngIntroGateProps) {
  const introActive = active;
  const t = useTranslations("SvgToPngLanding");
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

    document.documentElement.setAttribute("data-svg-to-png-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-svg-to-png-intro");
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
        className="s2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s2p-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="s2p-fs__header">
          <h1 id="s2p-fs-title" className="s2p-fs__title">
            <span className="s2p-fs__title-brand">{t("brand")}</span>
            <span className="s2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="s2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="s2p-fs__stage" aria-hidden>
          <div className="s2p-fs__scene">
            <div className="s2p-fs__workspace animation-workspace" data-splash-wide>
              <div className="s2p-fs__engine">
                {/* Left — vector node workspace */}
                <div className="s2p-fs__panel s2p-fs__panel--vector">
                  <span className="s2p-fs__pill s2p-fs__pill--svg">{t("svgBadge")}</span>
                  <div className="s2p-fs__vector-frame">
                    <div className="s2p-fs__grid" />
                    <svg
                      className="s2p-fs__svg"
                      viewBox="0 0 160 120"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Bézier control handles */}
                      <line className="s2p-fs__handle" x1="72" y1="22" x2="98" y2="8" />
                      <line className="s2p-fs__handle" x1="72" y1="22" x2="48" y2="6" />
                      <line className="s2p-fs__handle" x1="118" y1="78" x2="138" y2="52" />
                      <line className="s2p-fs__handle" x1="42" y1="88" x2="22" y2="62" />

                      <path
                        className="s2p-fs__geo s2p-fs__geo--a"
                        d="M28 96 L72 22 L118 96 Z"
                      />
                      <path
                        className="s2p-fs__geo s2p-fs__geo--b"
                        d="M42 88 C62 48 98 48 118 78 C98 68 72 68 42 88 Z"
                      />
                      <path
                        className="s2p-fs__geo s2p-fs__geo--c"
                        d="M24 48 Q72 4 132 42"
                      />

                      <circle className="s2p-fs__node" cx="28" cy="96" r="3.2" />
                      <circle className="s2p-fs__node" cx="72" cy="22" r="3.2" />
                      <circle className="s2p-fs__node" cx="118" cy="96" r="3.2" />
                      <circle className="s2p-fs__node" cx="42" cy="88" r="2.6" />
                      <circle className="s2p-fs__node" cx="118" cy="78" r="2.6" />
                      <circle className="s2p-fs__node" cx="24" cy="48" r="2.2" />
                      <circle className="s2p-fs__node" cx="132" cy="42" r="2.2" />

                      <circle className="s2p-fs__node s2p-fs__node--ctrl" cx="98" cy="8" r="2" />
                      <circle className="s2p-fs__node s2p-fs__node--ctrl" cx="48" cy="6" r="2" />
                      <circle className="s2p-fs__node s2p-fs__node--ctrl" cx="138" cy="52" r="2" />
                      <circle className="s2p-fs__node s2p-fs__node--ctrl" cx="22" cy="62" r="2" />
                    </svg>

                    <div className="s2p-fs__lasers">
                      <span className="s2p-fs__beam s2p-fs__beam--a" />
                      <span className="s2p-fs__beam s2p-fs__beam--b" />
                      <span className="s2p-fs__beam s2p-fs__beam--c" />
                    </div>

                    <span className="s2p-fs__xml s2p-fs__xml--a">{t("xmlHint")}</span>
                    <span className="s2p-fs__xml s2p-fs__xml--b">{t("pathHint")}</span>
                    <span className="s2p-fs__xml s2p-fs__xml--c">{t("viewHint")}</span>
                  </div>
                </div>

                {/* Bridge — particle matrix */}
                <div className="s2p-fs__bridge">
                  <div className="s2p-fs__matrix">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="s2p-fs__flow" />
                </div>

                {/* Right — hi-fi PNG output */}
                <div className="s2p-fs__panel s2p-fs__panel--png">
                  <span className="s2p-fs__pill s2p-fs__pill--png">{t("pngBadge")}</span>
                  <div className="s2p-fs__png-frame">
                    <div className="s2p-fs__checker" />
                    <div className="s2p-fs__png-art">
                      <span className="s2p-fs__png-tri" />
                      <span className="s2p-fs__png-blob" />
                      <span className="s2p-fs__png-arc" />
                    </div>
                    <span className="s2p-fs__res">{t("resHint")}</span>
                  </div>
                </div>
              </div>

              <span className="s2p-fs__ok">
                <span className="s2p-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="s2p-fs__footer">
          <button type="button" className="s2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="s2p-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
