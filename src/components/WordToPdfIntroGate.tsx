"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./word-to-pdf-landing.css";

type IntroPhase = "intro" | "workspace";

type WordToPdfIntroGateProps = {
  /** When false, children render immediately (non–word-to-pdf tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Convert Word to PDF Online.
 * Blue DOCX page → conversion laser locks fonts → red PDF + DOCX→PDF badges.
 * Only runs inside the ToolModal CALC embed.
 */
export function WordToPdfIntroGate({
  active = true,
  children,
}: WordToPdfIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("WordToPdfLanding");
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

    document.documentElement.setAttribute("data-word-to-pdf-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-word-to-pdf-intro");
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
        className="w2p-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="w2p-fs-title"
      >
        <header className="w2p-fs__header">
          <h1 id="w2p-fs-title" className="w2p-fs__title">
            <span className="w2p-fs__title-brand">{t("brand")}</span>
            <span className="w2p-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="w2p-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="w2p-fs__stage" aria-hidden>
          <div className="w2p-fs__scene">
            <div className="w2p-fs__workspace animation-workspace">
              <div className="w2p-fs__card">
                <div className="w2p-fs__badges">
                  <span className="w2p-fs__badge w2p-fs__badge--docx">{t("docxBadge")}</span>
                  <span className="w2p-fs__arrow" aria-hidden>
                    →
                  </span>
                  <span className="w2p-fs__badge w2p-fs__badge--pdf">{t("pdfBadge")}</span>
                </div>

                <div className="w2p-fs__stage-docs">
                  <div className="w2p-fs__doc w2p-fs__doc--word">
                    <span className="w2p-fs__doc-icon w2p-fs__doc-icon--word">W</span>
                    <span className="w2p-fs__line w2p-fs__line--title" />
                    <span className="w2p-fs__line" />
                    <span className="w2p-fs__line w2p-fs__line--short" />
                    <span className="w2p-fs__line" />
                    <span className="w2p-fs__line w2p-fs__line--mid" />
                  </div>

                  <div className="w2p-fs__doc w2p-fs__doc--pdf">
                    <span className="w2p-fs__doc-icon w2p-fs__doc-icon--pdf">PDF</span>
                    <span className="w2p-fs__line w2p-fs__line--title" />
                    <span className="w2p-fs__line" />
                    <span className="w2p-fs__line w2p-fs__line--short" />
                    <span className="w2p-fs__line" />
                    <span className="w2p-fs__line w2p-fs__line--mid" />
                    <span className="w2p-fs__lock-bar">{t("locked")}</span>
                  </div>

                  <div className="w2p-fs__laser" />
                </div>

                <div className="w2p-fs__status">
                  <span className="w2p-fs__status-label">{t("converting")}</span>
                  <span className="w2p-fs__status-done">{t("rendered")}</span>
                </div>
              </div>

              <span className="w2p-fs__ok">
                <span className="w2p-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="w2p-fs__footer">
          <button type="button" className="w2p-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="w2p-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
