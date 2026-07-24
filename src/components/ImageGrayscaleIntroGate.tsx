"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./image-grayscale-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageGrayscaleIntroGateProps = {
  /** When false, children render immediately (non–image-grayscale tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Grayscale.
 * Side-by-side RGB isolation → dual-tone laser filter → hi-contrast monochrome.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function ImageGrayscaleIntroGate({
  active = true,
  children,
}: ImageGrayscaleIntroGateProps) {
  const introActive = active;
  const t = useTranslations("ImageGrayscaleLanding");
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

    document.documentElement.setAttribute("data-image-grayscale-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-image-grayscale-intro");
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
        className="igs-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="igs-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="igs-fs__header">
          <h1 id="igs-fs-title" className="igs-fs__title">
            <span className="igs-fs__title-brand">{t("brand")}</span>
            <span className="igs-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="igs-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="igs-fs__stage" aria-hidden>
          <div className="igs-fs__scene">
            <div className="igs-fs__workspace animation-workspace" data-splash-wide>
              <div className="igs-fs__engine">
                {/* Left — full-color source + RGB spectrum */}
                <div className="igs-fs__panel igs-fs__panel--color">
                  <span className="igs-fs__pill igs-fs__pill--color">{t("colorBadge")}</span>
                  <div className="igs-fs__frame igs-fs__frame--color">
                    <div className="igs-fs__sky" />
                    <div className="igs-fs__sun" />
                    <div className="igs-fs__hills" />
                    <div className="igs-fs__subject" />

                    <div className="igs-fs__spectrum">
                      <span className="igs-fs__ch igs-fs__ch--r">{t("chR")}</span>
                      <span className="igs-fs__ch igs-fs__ch--g">{t("chG")}</span>
                      <span className="igs-fs__ch igs-fs__ch--b">{t("chB")}</span>
                    </div>

                    <div className="igs-fs__bands">
                      <span className="igs-fs__band igs-fs__band--r" />
                      <span className="igs-fs__band igs-fs__band--g" />
                      <span className="igs-fs__band igs-fs__band--b" />
                    </div>

                    <div className="igs-fs__lasers">
                      <span className="igs-fs__beam igs-fs__beam--a" />
                      <span className="igs-fs__beam igs-fs__beam--b" />
                    </div>
                  </div>
                </div>

                {/* Bridge — particle matrix */}
                <div className="igs-fs__bridge">
                  <div className="igs-fs__matrix">
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
                  <span className="igs-fs__flow" />
                </div>

                {/* Right — high-contrast monochrome */}
                <div className="igs-fs__panel igs-fs__panel--mono">
                  <span className="igs-fs__pill igs-fs__pill--mono">{t("monoBadge")}</span>
                  <div className="igs-fs__frame igs-fs__frame--mono">
                    <div className="igs-fs__sky igs-fs__sky--bw" />
                    <div className="igs-fs__sun igs-fs__sun--bw" />
                    <div className="igs-fs__hills igs-fs__hills--bw" />
                    <div className="igs-fs__subject igs-fs__subject--bw" />
                    <span className="igs-fs__tone">{t("toneHint")}</span>
                  </div>
                </div>
              </div>

              <span className="igs-fs__ok">
                <span className="igs-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="igs-fs__footer">
          <button type="button" className="igs-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="igs-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
