"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./image-blur-redact-landing.css";

type IntroPhase = "intro" | "workspace";

type ImageBlurRedactIntroGateProps = {
  /** When false, children render immediately (non–image-blur-redact tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Image Blur & Redact.
 * Cursor blurs a face region, then redacts a sensitive text block — with tool cues.
 * Only runs inside the ToolModal CALC embed.
 */
export function ImageBlurRedactIntroGate({
  active = true,
  children,
}: ImageBlurRedactIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("ImageBlurRedactLanding");
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

    document.documentElement.setAttribute("data-blur-redact-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-blur-redact-intro");
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
        className="blr-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blr-fs-title"
      >
        <header className="blr-fs__header">
          <h1 id="blr-fs-title" className="blr-fs__title">
            <span className="blr-fs__title-brand">{t("brand")}</span>
            <span className="blr-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="blr-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="blr-fs__stage" aria-hidden>
          <div className="blr-fs__scene">
            <div className="blr-fs__workspace animation-workspace">
              <div className="blr-fs__card">
                <div className="blr-fs__doc">
                  <div className="blr-fs__doc-head">
                    <div className="blr-fs__avatar">
                      <span className="blr-fs__avatar-face" />
                      <span className="blr-fs__avatar-blur" />
                      <span className="blr-fs__pixels" aria-hidden>
                        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                      </span>
                    </div>
                    <div className="blr-fs__meta">
                      <span className="blr-fs__line blr-fs__line--lg" />
                      <span className="blr-fs__line" />
                      <span className="blr-fs__line blr-fs__line--sm" />
                    </div>
                  </div>

                  <div className="blr-fs__body">
                    <span className="blr-fs__line" />
                    <span className="blr-fs__line blr-fs__line--wide" />
                    <div className="blr-fs__sensitive">
                      <span className="blr-fs__card-num">{t("cardNum")}</span>
                      <span className="blr-fs__redact" />
                    </div>
                    <span className="blr-fs__line blr-fs__line--sm" />
                    <div className="blr-fs__sign-row">
                      <span className="blr-fs__sign">{t("signature")}</span>
                      <span className="blr-fs__redact blr-fs__redact--sign" />
                    </div>
                  </div>
                </div>

                <div className="blr-fs__cursor">
                  <span className="blr-fs__cursor-pointer" />
                  <span className="blr-fs__cue blr-fs__cue--blur">{t("blur")}</span>
                  <span className="blr-fs__cue blr-fs__cue--redact">{t("redact")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="blr-fs__footer">
          <button type="button" className="blr-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="blr-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
