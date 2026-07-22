"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./ebook-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type EbookToPdfIntroGateProps = {
  /** When false, children render immediately (non–ebook-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for eBook to PDF.
 * 3D EPUB card with page flips → consolidates into PDF with red badge.
 * Only runs inside the ToolModal CALC embed.
 */
export function EbookToPdfIntroGate({
  active = true,
  children,
}: EbookToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("EbookToPdfLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-ebook-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-ebook-intro");
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
        className="ebk-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ebk-fs-title"
      >
        <header className="ebk-fs__header">
          <h1 id="ebk-fs-title" className="ebk-fs__title">
            <span className="ebk-fs__title-brand">{t("brand")}</span>
            <span className="ebk-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="ebk-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="ebk-fs__stage" aria-hidden>
          <div className="ebk-fs__scene">
            <div className="ebk-fs__workspace">
              <div className="ebk-fs__particles">
                <span /><span /><span /><span /><span /><span />
              </div>

              <div className="ebk-fs__ebook">
                <div className="ebk-fs__book">
                  <div className="ebk-fs__cover">
                    <span className="ebk-fs__epub">{t("epubBadge")}</span>
                    <span className="ebk-fs__cover-title">{t("bookTitle")}</span>
                    <div className="ebk-fs__cover-lines">
                      <span /><span /><span />
                    </div>
                  </div>
                  <div className="ebk-fs__page ebk-fs__page--1">
                    <div className="ebk-fs__page-lines">
                      <span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <div className="ebk-fs__page ebk-fs__page--2">
                    <div className="ebk-fs__page-lines">
                      <span /><span /><span /><span />
                    </div>
                  </div>
                  <div className="ebk-fs__page ebk-fs__page--3">
                    <div className="ebk-fs__page-lines">
                      <span /><span /><span /><span /><span /><span />
                    </div>
                  </div>
                </div>
                <span className="ebk-fs__bookmark" />
                <span className="ebk-fs__ebook-name">{t("ebookName")}</span>
              </div>

              <div className="ebk-fs__pdf">
                <div className="ebk-fs__pdf-sheet">
                  <span className="ebk-fs__pdf-badge">{t("pdfBadge")}</span>
                  <div className="ebk-fs__pdf-lines">
                    <span /><span /><span /><span /><span />
                  </div>
                  <span className="ebk-fs__pages">{t("pageCount")}</span>
                </div>
                <span className="ebk-fs__pdf-name">{t("pdfName")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ebk-fs__footer">
          <button type="button" className="ebk-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="ebk-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
