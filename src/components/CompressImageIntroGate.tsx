"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import "./compress-image-landing.css";

type IntroPhase = "intro" | "workspace";

type CompressImageIntroGateProps = {
  /** When false, children render immediately (non–compress-image tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Compress Images.
 * Landscape preview → quality loupe scan → size badge shrinks with savings.
 * Only runs inside the ToolModal CALC embed.
 */
export function CompressImageIntroGate({
  active = true,
  children,
}: CompressImageIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("CompressImageLanding");
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

    document.documentElement.setAttribute("data-compress-image-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-compress-image-intro");
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
        className="cimg-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cimg-fs-title"
      >
        <header className="cimg-fs__header">
          <h1 id="cimg-fs-title" className="cimg-fs__title">
            <span className="cimg-fs__title-brand">{t("brand")}</span>
            <span className="cimg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="cimg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="cimg-fs__stage" aria-hidden>
          <div className="cimg-fs__scene">
            <div className="cimg-fs__workspace">
              <div className="cimg-fs__particles">
                <span /><span /><span /><span /><span /><span /><span /><span />
              </div>

              <div className="cimg-fs__card">
                <div className="cimg-fs__photo">
                  <div className="cimg-fs__sky" />
                  <div className="cimg-fs__mountains" />
                  <div className="cimg-fs__water" />
                  <div className="cimg-fs__detail" />
                  <div className="cimg-fs__loupe">
                    <span className="cimg-fs__loupe-glass" />
                    <span className="cimg-fs__loupe-ring" />
                  </div>
                  <div className="cimg-fs__shield" />
                </div>

                <div className="cimg-fs__meta">
                  <div className="cimg-fs__size">
                    <span className="cimg-fs__size-val cimg-fs__size-val--a">{t("sizeFrom")}</span>
                    <span className="cimg-fs__size-val cimg-fs__size-val--b">{t("sizeMid")}</span>
                    <span className="cimg-fs__size-val cimg-fs__size-val--c">{t("sizeTo")}</span>
                  </div>
                  <span className="cimg-fs__savings">{t("savings")}</span>
                </div>
                <span className="cimg-fs__quality">{t("quality")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cimg-fs__footer">
          <button type="button" className="cimg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="cimg-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
