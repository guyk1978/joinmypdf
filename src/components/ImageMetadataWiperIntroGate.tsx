"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./image-metadata-wiper-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageMetadataWiperIntroGateProps = {
  /** When false, children render immediately (non–image-metadata-wiper tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Metadata & Privacy Wiper.
 * Large photo + EXIF panel → cursor strips metadata → Privacy Secured.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function ImageMetadataWiperIntroGate({
  active = true,
  children,
}: ImageMetadataWiperIntroGateProps) {
  const introActive = active;
  const t = useTranslations("ImageMetadataWiperLanding");
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

    document.documentElement.setAttribute("data-image-metadata-wiper-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-image-metadata-wiper-intro");
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
        className="imw-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="imw-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="imw-fs__header">
          <h1 id="imw-fs-title" className="imw-fs__title">
            <span className="imw-fs__title-brand">{t("brand")}</span>
            <span className="imw-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="imw-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="imw-fs__stage" aria-hidden>
          <div className="imw-fs__scene">
            <div className="imw-fs__workspace animation-workspace" data-splash-wide>
              <div className="imw-fs__engine">
                <div className="imw-fs__status-row">
                  <span className="imw-fs__pill imw-fs__pill--risk">{t("riskBadge")}</span>
                  <span className="imw-fs__status-line" />
                  <span className="imw-fs__pill imw-fs__pill--clean">{t("cleanBadge")}</span>
                </div>

                <div className="imw-fs__body">
                  {/* Left — image thumbnail */}
                  <div className="imw-fs__photo">
                    <span className="imw-fs__sky" />
                    <span className="imw-fs__sun" />
                    <span className="imw-fs__hill" />
                    <span className="imw-fs__file">{t("fileName")}</span>
                    <span className="imw-fs__beam" />
                  </div>

                  {/* Right — EXIF panel */}
                  <div className="imw-fs__sheet">
                    <div className="imw-fs__row imw-fs__row--cam">
                      <span className="imw-fs__key">{t("tagCamera")}</span>
                      <span className="imw-fs__val">{t("valCamera")}</span>
                    </div>
                    <div className="imw-fs__row imw-fs__row--gps">
                      <span className="imw-fs__key">{t("tagGps")}</span>
                      <span className="imw-fs__val">{t("valGps")}</span>
                    </div>
                    <div className="imw-fs__row imw-fs__row--time">
                      <span className="imw-fs__key">{t("tagTimestamp")}</span>
                      <span className="imw-fs__val">{t("valTimestamp")}</span>
                    </div>
                    <div className="imw-fs__row imw-fs__row--device">
                      <span className="imw-fs__key">{t("tagDevice")}</span>
                      <span className="imw-fs__val">{t("valDevice")}</span>
                    </div>

                    <button type="button" className="imw-fs__wipe" tabIndex={-1}>
                      {t("wipeAction")}
                    </button>

                    <span className="imw-fs__cursor" />
                    <span className="imw-fs__sheet-flash" />
                  </div>
                </div>

                <div className="imw-fs__particles">
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

              <span className="imw-fs__ok">
                <span className="imw-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="imw-fs__footer">
          <button type="button" className="imw-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="imw-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
