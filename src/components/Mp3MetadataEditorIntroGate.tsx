"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./mp3-metadata-editor-landing.css";

type IntroPhase = "intro" | "workspace";

type Mp3MetadataEditorIntroGateProps = {
  /** When false, children render immediately (non–mp3-metadata-editor tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for MP3 Metadata Editor (ID3).
 * Cover art + live Title/Artist/Album/Year typing → ID3v2 header update + Metadata Saved.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function Mp3MetadataEditorIntroGate({
  active = true,
  children,
}: Mp3MetadataEditorIntroGateProps) {
  const introActive = active;
  const t = useTranslations("Mp3MetadataEditorLanding");
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

    document.documentElement.setAttribute("data-mp3-metadata-editor-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-mp3-metadata-editor-intro");
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
        className="id3-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="id3-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="id3-fs__header">
          <h1 id="id3-fs-title" className="id3-fs__title">
            <span className="id3-fs__title-brand">{t("brand")}</span>
            <span className="id3-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="id3-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="id3-fs__stage" aria-hidden>
          <div className="id3-fs__scene">
            <div className="id3-fs__workspace animation-workspace">
              <div className="id3-fs__card">
                <div className="id3-fs__body">
                  <div className="id3-fs__cover">
                    <span className="id3-fs__cover-art" />
                    <span className="id3-fs__cover-glow" />
                    <span className="id3-fs__cover-label">{t("coverLabel")}</span>
                  </div>

                  <div className="id3-fs__fields">
                    <div className="id3-fs__row id3-fs__row--title">
                      <span className="id3-fs__key">{t("fieldTitle")}</span>
                      <span className="id3-fs__value">
                        <span className="id3-fs__typed">{t("sampleTitle")}</span>
                        <span className="id3-fs__caret" />
                      </span>
                    </div>
                    <div className="id3-fs__row id3-fs__row--artist">
                      <span className="id3-fs__key">{t("fieldArtist")}</span>
                      <span className="id3-fs__value">
                        <span className="id3-fs__typed">{t("sampleArtist")}</span>
                        <span className="id3-fs__caret" />
                      </span>
                    </div>
                    <div className="id3-fs__row id3-fs__row--album">
                      <span className="id3-fs__key">{t("fieldAlbum")}</span>
                      <span className="id3-fs__value">
                        <span className="id3-fs__typed">{t("sampleAlbum")}</span>
                        <span className="id3-fs__caret" />
                      </span>
                    </div>
                    <div className="id3-fs__row id3-fs__row--year">
                      <span className="id3-fs__key">{t("fieldYear")}</span>
                      <span className="id3-fs__value">
                        <span className="id3-fs__typed">{t("sampleYear")}</span>
                        <span className="id3-fs__caret" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="id3-fs__pills">
                  <span className="id3-fs__pill id3-fs__pill--tit2">{t("tagTit2")}</span>
                  <span className="id3-fs__pill id3-fs__pill--tpe1">{t("tagTpe1")}</span>
                  <span className="id3-fs__pill id3-fs__pill--talb">{t("tagTalb")}</span>
                  <span className="id3-fs__pill id3-fs__pill--id3v2">{t("id3Updated")}</span>
                </div>

                <span className="id3-fs__particle id3-fs__particle--1" />
                <span className="id3-fs__particle id3-fs__particle--2" />
                <span className="id3-fs__particle id3-fs__particle--3" />
                <span className="id3-fs__particle id3-fs__particle--4" />
              </div>

              <span className="id3-fs__ok">
                <span className="id3-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="id3-fs__footer">
          <button type="button" className="id3-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="id3-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
