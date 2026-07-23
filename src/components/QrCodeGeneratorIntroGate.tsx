"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./qr-code-generator-landing.css";

type IntroPhase = "intro" | "workspace";

type QrCodeGeneratorIntroGateProps = {
  /** When false, children render immediately (non–qr-code-generator tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Create QR Codes Online.
 * URL/text → matrix laser → alignment squares + modules assemble into QR.
 * Only runs inside the ToolModal CALC embed.
 */
export function QrCodeGeneratorIntroGate({
  active = true,
  children,
}: QrCodeGeneratorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("QrCodeGeneratorLanding");
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

    document.documentElement.setAttribute("data-qr-code-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-qr-code-intro");
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
        className="qr-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-fs-title"
      >
        <header className="qr-fs__header">
          <h1 id="qr-fs-title" className="qr-fs__title">
            <span className="qr-fs__title-brand">{t("brand")}</span>
            <span className="qr-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="qr-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="qr-fs__stage" aria-hidden>
          <div className="qr-fs__scene">
            <div className="qr-fs__workspace animation-workspace">
              <div className="qr-fs__card">
                <div className="qr-fs__badges">
                  <span className="qr-fs__badge qr-fs__badge--url">{t("urlBadge")}</span>
                  <span className="qr-fs__badge qr-fs__badge--qr">{t("qrBadge")}</span>
                </div>

                <p className="qr-fs__input">{t("sampleUrl")}</p>

                <div className="qr-fs__matrix">
                  <span className="qr-fs__finder qr-fs__finder--tl" />
                  <span className="qr-fs__finder qr-fs__finder--tr" />
                  <span className="qr-fs__finder qr-fs__finder--bl" />
                  <div className="qr-fs__modules" />
                  <div className="qr-fs__laser" />
                </div>
              </div>

              <span className="qr-fs__ok">
                <span className="qr-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="qr-fs__footer">
          <button type="button" className="qr-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="qr-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
