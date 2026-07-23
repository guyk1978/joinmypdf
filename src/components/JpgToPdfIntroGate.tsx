"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./jpg-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type JpgToPdfIntroGateProps = {
  /** When false, children render immediately (non–jpg-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert JPG to PDF.
 * Fan of .jpg thumbnails → glide/stack → bind into multi-page PDF card.
 * Only runs inside the ToolModal CALC embed.
 */
export function JpgToPdfIntroGate({
  active = true,
  children,
}: JpgToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("JpgToPdfLanding");
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

    document.documentElement.setAttribute("data-jpg-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-jpg-to-pdf-intro");
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
        className="j2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="j2p-fs-title"
      >
        <header className="j2p-fs__header">
          <h1 id="j2p-fs-title" className="j2p-fs__title">
            <span className="j2p-fs__title-brand">{t("brand")}</span>
            <span className="j2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="j2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="j2p-fs__stage" aria-hidden>
          <div className="j2p-fs__scene">
            <div className="j2p-fs__workspace animation-workspace">
              <div className="j2p-fs__guides">
                <span className="j2p-fs__guide j2p-fs__guide--v" />
                <span className="j2p-fs__guide j2p-fs__guide--h" />
              </div>

              <div className="j2p-fs__fan">
                <div className="j2p-fs__thumb j2p-fs__thumb--a">
                  <div className="j2p-fs__thumb-art j2p-fs__thumb-art--a" />
                  <span className="j2p-fs__fmt">{t("jpgBadge")}</span>
                </div>
                <div className="j2p-fs__thumb j2p-fs__thumb--b">
                  <div className="j2p-fs__thumb-art j2p-fs__thumb-art--b" />
                  <span className="j2p-fs__fmt">{t("jpgBadge")}</span>
                </div>
                <div className="j2p-fs__thumb j2p-fs__thumb--c">
                  <div className="j2p-fs__thumb-art j2p-fs__thumb-art--c" />
                  <span className="j2p-fs__fmt">{t("jpgBadge")}</span>
                </div>
              </div>

              <div className="j2p-fs__pdf">
                <div className="j2p-fs__pdf-sheet">
                  <span className="j2p-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="j2p-fs__pages">
                    <span className="j2p-fs__page j2p-fs__page--1" />
                    <span className="j2p-fs__page j2p-fs__page--2" />
                    <span className="j2p-fs__page j2p-fs__page--3" />
                  </div>
                  <div className="j2p-fs__binds">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="j2p-fs__count">{t("pageCount")}</span>
                </div>
                <span className="j2p-fs__pdf-name">{t("pdfName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="j2p-fs__footer">
          <button type="button" className="j2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="j2p-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
