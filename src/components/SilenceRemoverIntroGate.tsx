"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./silence-remover-landing.css";

type IntroPhase = "intro" | "workspace";

type SilenceRemoverIntroGateProps = {
  /** When false, children render immediately (non–silence-remover tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Silent Remover.
 * Gapped waveform → laser silence scan → collapse/splice → Silence Removed & Spliced.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function SilenceRemoverIntroGate({
  active = true,
  children,
}: SilenceRemoverIntroGateProps) {
  const introActive = active;
  const t = useTranslations("SilenceRemoverLanding");
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

    document.documentElement.setAttribute("data-silence-remover-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-silence-remover-intro");
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
        className="sil-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sil-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="sil-fs__header">
          <h1 id="sil-fs-title" className="sil-fs__title">
            <span className="sil-fs__title-brand">{t("brand")}</span>
            <span className="sil-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="sil-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="sil-fs__stage" aria-hidden>
          <div className="sil-fs__scene">
            <div className="sil-fs__workspace animation-workspace">
              <div className="sil-fs__card">
                <div className="sil-fs__meta-row">
                  <span className="sil-fs__meta-label">{t("scanLabel")}</span>
                  <span className="sil-fs__meta-threshold">{t("threshold")}</span>
                </div>

                <div className="sil-fs__wave-wrap">
                  <div className="sil-fs__gap sil-fs__gap--1" />
                  <div className="sil-fs__gap sil-fs__gap--2" />
                  <div className="sil-fs__gap sil-fs__gap--3" />

                  <div className="sil-fs__spectrum">
                    {Array.from({ length: 40 }, (_, i) => {
                      const isSilent =
                        (i >= 8 && i <= 11) ||
                        (i >= 20 && i <= 24) ||
                        (i >= 32 && i <= 35);
                      return (
                        <span
                          key={i}
                          className={
                            isSilent
                              ? "sil-fs__bar sil-fs__bar--silent"
                              : "sil-fs__bar"
                          }
                          style={{ animationDelay: `${(i % 10) * 0.05}s` }}
                        />
                      );
                    })}
                  </div>

                  <div className="sil-fs__laser" />
                  <div className="sil-fs__splice" />
                </div>

                <div className="sil-fs__pills">
                  <span className="sil-fs__pill sil-fs__pill--long">{t("durLong")}</span>
                  <span className="sil-fs__pill sil-fs__pill--arrow" aria-hidden>
                    →
                  </span>
                  <span className="sil-fs__pill sil-fs__pill--short">{t("durShort")}</span>
                </div>

                <span className="sil-fs__particle sil-fs__particle--1" />
                <span className="sil-fs__particle sil-fs__particle--2" />
                <span className="sil-fs__particle sil-fs__particle--3" />
                <span className="sil-fs__particle sil-fs__particle--4" />
              </div>

              <span className="sil-fs__ok">
                <span className="sil-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="sil-fs__footer">
          <button type="button" className="sil-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="sil-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
