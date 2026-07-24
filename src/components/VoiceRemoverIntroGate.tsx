"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./voice-remover-landing.css";

type IntroPhase = "intro" | "workspace";

type VoiceRemoverIntroGateProps = {
  /** When false, children render immediately (non–voice-remover tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Voice Remover (Instrumental Maker).
 * Mixed track → frequency filter laser → Vocals (muted) + Instrumental (glowing).
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function VoiceRemoverIntroGate({
  active = true,
  children,
}: VoiceRemoverIntroGateProps) {
  const introActive = active;
  const t = useTranslations("VoiceRemoverLanding");
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

    document.documentElement.setAttribute("data-voice-remover-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-voice-remover-intro");
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
        className="vrm-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vrm-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="vrm-fs__header">
          <h1 id="vrm-fs-title" className="vrm-fs__title">
            <span className="vrm-fs__title-brand">{t("brand")}</span>
            <span className="vrm-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="vrm-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="vrm-fs__stage" aria-hidden>
          <div className="vrm-fs__scene">
            <div className="vrm-fs__workspace animation-workspace">
              <div className="vrm-fs__card">
                <div className="vrm-fs__panels">
                  <div className="vrm-fs__panel vrm-fs__panel--mix">
                    <span className="vrm-fs__tag vrm-fs__tag--mix">{t("mixTag")}</span>
                    <div className="vrm-fs__eq vrm-fs__eq--mix">
                      {Array.from({ length: 14 }, (_, i) => (
                        <span
                          key={i}
                          className="vrm-fs__bar vrm-fs__bar--mix"
                          style={{ animationDelay: `${(i % 7) * 0.07}s` }}
                        />
                      ))}
                    </div>
                    <span className="vrm-fs__panel-hint">{t("mixHint")}</span>
                  </div>

                  <div className="vrm-fs__pipe">
                    <span className="vrm-fs__pipe-line" />
                    <span className="vrm-fs__filter">
                      <span className="vrm-fs__filter-ring" />
                      <span className="vrm-fs__filter-core" />
                    </span>
                    <span className="vrm-fs__laser" />
                    <span className="vrm-fs__split-y" />
                  </div>

                  <div className="vrm-fs__stems">
                    <div className="vrm-fs__panel vrm-fs__panel--vocal">
                      <span className="vrm-fs__tag vrm-fs__tag--vocal">{t("vocalTag")}</span>
                      <div className="vrm-fs__eq vrm-fs__eq--vocal">
                        {Array.from({ length: 10 }, (_, i) => (
                          <span
                            key={i}
                            className="vrm-fs__bar vrm-fs__bar--vocal"
                            style={{ animationDelay: `${(i % 5) * 0.09}s` }}
                          />
                        ))}
                      </div>
                      <span className="vrm-fs__panel-hint">{t("vocalHint")}</span>
                    </div>

                    <div className="vrm-fs__panel vrm-fs__panel--inst">
                      <span className="vrm-fs__tag vrm-fs__tag--inst">{t("instTag")}</span>
                      <div className="vrm-fs__eq vrm-fs__eq--inst">
                        {Array.from({ length: 10 }, (_, i) => (
                          <span
                            key={i}
                            className="vrm-fs__bar vrm-fs__bar--inst"
                            style={{ animationDelay: `${(i % 5) * 0.08}s` }}
                          />
                        ))}
                      </div>
                      <span className="vrm-fs__panel-hint">{t("instHint")}</span>
                    </div>
                  </div>
                </div>

                <div className="vrm-fs__pills">
                  <span className="vrm-fs__pill vrm-fs__pill--mix">{t("mixPill")}</span>
                  <span className="vrm-fs__pill vrm-fs__pill--filter">{t("filterPill")}</span>
                  <span className="vrm-fs__pill vrm-fs__pill--inst">{t("instPill")}</span>
                </div>

                <span className="vrm-fs__particle vrm-fs__particle--1" />
                <span className="vrm-fs__particle vrm-fs__particle--2" />
                <span className="vrm-fs__particle vrm-fs__particle--3" />
                <span className="vrm-fs__particle vrm-fs__particle--4" />
              </div>

              <span className="vrm-fs__ok">
                <span className="vrm-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="vrm-fs__footer">
          <button type="button" className="vrm-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="vrm-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
