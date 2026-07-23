"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./png-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type PngToPdfIntroGateProps = {
  /** When false, children render immediately (non–png-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert PNG to PDF Online.
 * Multiple PNG thumbnails slide together and bind into a multi-page PDF booklet.
 * Only runs inside the ToolModal CALC embed.
 */
export function PngToPdfIntroGate({ active = true, children }: PngToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PngToPdfLanding");
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

    document.documentElement.setAttribute("data-png-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-png-to-pdf-intro");
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
        className="n2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="n2p-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="n2p-fs__header">
          <h1 id="n2p-fs-title" className="n2p-fs__title">
            <span className="n2p-fs__title-brand">{t("brand")}</span>
            <span className="n2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="n2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="n2p-fs__stage" aria-hidden>
          <div className="n2p-fs__scene">
            <div
              className="n2p-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="n2p-fs__card">
                <div className="n2p-fs__badges">
                  <span className="n2p-fs__badge n2p-fs__badge--png">{t("pngBadge")}</span>
                  <span className="n2p-fs__arrow" />
                  <span className="n2p-fs__badge n2p-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="n2p-fs__stage-art">
                  <div className="n2p-fs__thumbs">
                    <div className="n2p-fs__thumb n2p-fs__thumb--a">
                      <span className="n2p-fs__checker" />
                      <span className="n2p-fs__thumb-art n2p-fs__thumb-art--a" />
                      <span className="n2p-fs__thumb-fmt">{t("pngBadge")}</span>
                    </div>
                    <div className="n2p-fs__thumb n2p-fs__thumb--b">
                      <span className="n2p-fs__checker" />
                      <span className="n2p-fs__thumb-art n2p-fs__thumb-art--b" />
                      <span className="n2p-fs__thumb-fmt">{t("pngBadge")}</span>
                    </div>
                    <div className="n2p-fs__thumb n2p-fs__thumb--c">
                      <span className="n2p-fs__checker" />
                      <span className="n2p-fs__thumb-art n2p-fs__thumb-art--c" />
                      <span className="n2p-fs__thumb-fmt">{t("pngBadge")}</span>
                    </div>
                  </div>

                  <div className="n2p-fs__pdf">
                    <span className="n2p-fs__pdf-fold" />
                    <span className="n2p-fs__pdf-mark">{t("pdfBadge")}</span>
                    <div className="n2p-fs__pages">
                      <span className="n2p-fs__page n2p-fs__page--1" />
                      <span className="n2p-fs__page n2p-fs__page--2" />
                      <span className="n2p-fs__page n2p-fs__page--3" />
                    </div>
                    <div className="n2p-fs__binds">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="n2p-fs__count">{t("pageCount")}</span>
                  </div>

                  <span className="n2p-fs__beam" />
                </div>

                <span className="n2p-fs__ok">
                  <span className="n2p-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="n2p-fs__footer">
          <button type="button" className="n2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="n2p-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
