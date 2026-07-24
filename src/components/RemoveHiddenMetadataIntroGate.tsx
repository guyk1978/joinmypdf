"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./remove-hidden-metadata-landing.css";

type IntroPhase = "intro" | "workspace";

type RemoveHiddenMetadataIntroGateProps = {
  /** When false, children render immediately (non–remove-hidden-metadata tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Remove PDF Metadata Online.
 * Floating Author/Creator/Date tags → privacy laser dissolves them → Metadata Stripped Clean.
 * Only runs inside the ToolModal CALC embed.
 */
export function RemoveHiddenMetadataIntroGate({
  active = true,
  children,
}: RemoveHiddenMetadataIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("RemoveHiddenMetadataLanding");
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

    document.documentElement.setAttribute("data-remove-hidden-metadata-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-remove-hidden-metadata-intro");
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
        className="rhm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rhm-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="rhm-fs__header">
          <h1 id="rhm-fs-title" className="rhm-fs__title">
            <span className="rhm-fs__title-brand">{t("brand")}</span>
            <span className="rhm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="rhm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="rhm-fs__stage" aria-hidden>
          <div className="rhm-fs__scene">
            <div
              className="rhm-fs__workspace animation-workspace"
              data-splash-wide
            >
              <div className="rhm-fs__card">
                <div className="rhm-fs__badges">
                  <span className="rhm-fs__badge rhm-fs__badge--risk">{t("riskBadge")}</span>
                  <span className="rhm-fs__arrow" />
                  <span className="rhm-fs__badge rhm-fs__badge--clean">{t("cleanBadge")}</span>
                </div>

                <div className="rhm-fs__stage-art">
                  <div className="rhm-fs__doc">
                    <span className="rhm-fs__fold" />
                    <span className="rhm-fs__line rhm-fs__line--title" />
                    <span className="rhm-fs__line" />
                    <span className="rhm-fs__line rhm-fs__line--short" />
                    <span className="rhm-fs__line" />
                    <span className="rhm-fs__line rhm-fs__line--mid" />
                  </div>

                  <span className="rhm-fs__tag rhm-fs__tag--author">{t("tagAuthor")}</span>
                  <span className="rhm-fs__tag rhm-fs__tag--creator">{t("tagCreator")}</span>
                  <span className="rhm-fs__tag rhm-fs__tag--date">{t("tagDate")}</span>
                  <span className="rhm-fs__tag rhm-fs__tag--producer">{t("tagProducer")}</span>
                  <span className="rhm-fs__tag rhm-fs__tag--mod">{t("tagModified")}</span>

                  <div className="rhm-fs__beam" />

                  <span className="rhm-fs__shield">
                    <span className="rhm-fs__shield-icon" />
                    {t("strippedBadge")}
                  </span>
                </div>

                <span className="rhm-fs__ok">
                  <span className="rhm-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rhm-fs__footer">
          <button type="button" className="rhm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="rhm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
