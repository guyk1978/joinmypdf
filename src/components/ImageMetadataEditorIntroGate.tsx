"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./image-metadata-editor-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageMetadataEditorIntroGateProps = {
  /** When false, children render immediately (non–image-metadata-editor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Metadata Editor.
 * Photo preview + live EXIF table → cursor edit/clear → Metadata Updated.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function ImageMetadataEditorIntroGate({
  active = true,
  children,
}: ImageMetadataEditorIntroGateProps) {
  const introActive = active;
  const t = useTranslations("ImageMetadataEditorLanding");
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

    document.documentElement.setAttribute("data-image-metadata-editor-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-image-metadata-editor-intro");
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
        className="ime-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ime-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="ime-fs__header">
          <h1 id="ime-fs-title" className="ime-fs__title">
            <span className="ime-fs__title-brand">{t("brand")}</span>
            <span className="ime-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ime-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ime-fs__stage" aria-hidden>
          <div className="ime-fs__scene">
            <div className="ime-fs__workspace animation-workspace" data-splash-wide>
              <div className="ime-fs__engine">
                {/* Left — image preview */}
                <div className="ime-fs__panel ime-fs__panel--photo">
                  <span className="ime-fs__pill ime-fs__pill--raw">{t("rawBadge")}</span>
                  <div className="ime-fs__photo">
                    <span className="ime-fs__sky" />
                    <span className="ime-fs__sun" />
                    <span className="ime-fs__hill" />
                    <span className="ime-fs__file">{t("fileName")}</span>
                    <span className="ime-fs__pulse" />
                  </div>
                </div>

                {/* Bridge */}
                <div className="ime-fs__bridge">
                  <div className="ime-fs__matrix">
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
                  <span className="ime-fs__flow" />
                </div>

                {/* Right — live EXIF table */}
                <div className="ime-fs__panel ime-fs__panel--sheet">
                  <span className="ime-fs__pill ime-fs__pill--clean">{t("cleanBadge")}</span>
                  <div className="ime-fs__sheet">
                    <div className="ime-fs__row ime-fs__row--camera">
                      <span className="ime-fs__key">{t("keyCamera")}</span>
                      <span className="ime-fs__val">
                        <span className="ime-fs__val-old">{t("valCameraOld")}</span>
                        <span className="ime-fs__val-new">{t("valCameraNew")}</span>
                        <span className="ime-fs__caret" />
                      </span>
                    </div>
                    <div className="ime-fs__row ime-fs__row--gps">
                      <span className="ime-fs__key">{t("keyGps")}</span>
                      <span className="ime-fs__val">
                        <span className="ime-fs__val-old">{t("valGps")}</span>
                        <span className="ime-fs__val-cleared">{t("valCleared")}</span>
                      </span>
                    </div>
                    <div className="ime-fs__row ime-fs__row--date">
                      <span className="ime-fs__key">{t("keyDate")}</span>
                      <span className="ime-fs__val">
                        <span className="ime-fs__val-old">{t("valDateOld")}</span>
                        <span className="ime-fs__val-new">{t("valDateNew")}</span>
                      </span>
                    </div>
                    <div className="ime-fs__row ime-fs__row--soft">
                      <span className="ime-fs__key">{t("keySoftware")}</span>
                      <span className="ime-fs__val ime-fs__val--static">{t("valSoftware")}</span>
                    </div>

                    <span className="ime-fs__cursor" />
                    <span className="ime-fs__sheet-pulse" />
                  </div>
                </div>
              </div>

              <span className="ime-fs__ok">
                <span className="ime-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="ime-fs__footer">
          <button type="button" className="ime-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="ime-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
