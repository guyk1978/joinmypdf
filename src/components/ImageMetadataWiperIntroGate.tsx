"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
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
 * EXIF tag bubbles float around a photo → privacy beam wipes them → EXIF Wiped lock.
 * Only runs inside the ToolModal CALC embed.
 */
export function ImageMetadataWiperIntroGate({
  active = true,
  children,
}: ImageMetadataWiperIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
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
            <div className="imw-fs__workspace animation-workspace">
              <div className="imw-fs__card">
                <div className="imw-fs__badges">
                  <span className="imw-fs__badge imw-fs__badge--risk">{t("riskBadge")}</span>
                  <span className="imw-fs__badge imw-fs__badge--clean">{t("cleanBadge")}</span>
                </div>

                <div className="imw-fs__preview">
                  <div className="imw-fs__photo">
                    <span className="imw-fs__sky" />
                    <span className="imw-fs__hill" />
                    <span className="imw-fs__sun" />
                  </div>

                  <span className="imw-fs__tag imw-fs__tag--gps">{t("tagGps")}</span>
                  <span className="imw-fs__tag imw-fs__tag--cam">{t("tagCamera")}</span>
                  <span className="imw-fs__tag imw-fs__tag--time">{t("tagTimestamp")}</span>
                  <span className="imw-fs__tag imw-fs__tag--device">{t("tagDevice")}</span>
                  <span className="imw-fs__tag imw-fs__tag--soft">{t("tagSoftware")}</span>

                  <div className="imw-fs__beam" />

                  <span className="imw-fs__lock">
                    <span className="imw-fs__padlock" />
                    {t("wipedBadge")}
                  </span>
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
      return <div className="imw-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
