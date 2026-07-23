"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./base-converter-landing.css";

type IntroPhase = "intro" | "workspace";

type BaseConverterIntroGateProps = {
  /** When false, children render immediately (non–base-converter tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Base Converter.
 * Terminal card morphs digits across Base 2 → decimal → Base 16.
 * Only runs inside the ToolModal CALC embed.
 */
export function BaseConverterIntroGate({
  active = true,
  children,
}: BaseConverterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("BaseConverterLanding");
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

    document.documentElement.setAttribute("data-base-converter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-base-converter-intro");
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
        className="bc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bc-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="bc-fs__header">
          <h1 id="bc-fs-title" className="bc-fs__title">
            <span className="bc-fs__title-brand">{t("brand")}</span>
            <span className="bc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="bc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="bc-fs__stage" aria-hidden>
          <div className="bc-fs__scene">
            <div className="bc-fs__workspace animation-workspace">
              <div className="bc-fs__card">
                <div className="bc-fs__chrome">
                  <span className="bc-fs__dot" />
                  <span className="bc-fs__dot" />
                  <span className="bc-fs__dot" />
                  <span className="bc-fs__prompt">{t("prompt")}</span>
                </div>

                <div className="bc-fs__bases">
                  <span className="bc-fs__base bc-fs__base--2">{t("base2")}</span>
                  <span className="bc-fs__pipe" />
                  <span className="bc-fs__base bc-fs__base--10">{t("base10")}</span>
                  <span className="bc-fs__pipe bc-fs__pipe--late" />
                  <span className="bc-fs__base bc-fs__base--16">{t("base16")}</span>
                </div>

                <div className="bc-fs__terminal">
                  <div className="bc-fs__row bc-fs__row--bin">
                    <span className="bc-fs__key">bin</span>
                    <span className="bc-fs__val bc-fs__val--bin">101010</span>
                  </div>
                  <div className="bc-fs__row bc-fs__row--dec">
                    <span className="bc-fs__key">dec</span>
                    <span className="bc-fs__val bc-fs__val--dec">42</span>
                  </div>
                  <div className="bc-fs__row bc-fs__row--hex">
                    <span className="bc-fs__key">hex</span>
                    <span className="bc-fs__val bc-fs__val--hex">0x2A</span>
                  </div>
                  <span className="bc-fs__cursor" />
                </div>
              </div>

              <span className="bc-fs__ok">
                <span className="bc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="bc-fs__footer">
          <button type="button" className="bc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="bc-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
