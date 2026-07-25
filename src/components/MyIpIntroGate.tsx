"use client";

import { type ReactNode } from "react";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import "./my-ip-landing.css";


type MyIpIntroGateProps = {
  /** When false, children render immediately (non–my-ip tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for IP Lookup & My IP.
 * Expanded radar card fills the middle zone; sweep locks onto IP → geo resolve.
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function MyIpIntroGate({ active = true, children }: MyIpIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-my-ip-intro",
  });
  const t = useTranslations("MyIpLanding");

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="mip-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mip-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="mip-fs__header">
          <h1 id="mip-fs-title" className="mip-fs__title">
            <span className="mip-fs__title-brand">{t("brand")}</span>
            <span className="mip-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="mip-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="mip-fs__stage" aria-hidden>
          <div className="mip-fs__scene">
            <div className="mip-fs__workspace animation-workspace">
              <div className="mip-fs__card">
                <div className="mip-fs__status-row">
                  <span className="mip-fs__status mip-fs__status--scan">{t("scanning")}</span>
                  <span className="mip-fs__status mip-fs__status--located">{t("located")}</span>
                </div>

                <div className="mip-fs__preview">
                  <div className="mip-fs__radar">
                    <span className="mip-fs__ring mip-fs__ring--1" />
                    <span className="mip-fs__ring mip-fs__ring--2" />
                    <span className="mip-fs__ring mip-fs__ring--3" />
                    <span className="mip-fs__sweep" />
                    <span className="mip-fs__blip" />
                    <span className="mip-fs__crosshair" />
                  </div>

                  <div className="mip-fs__details">
                    <span className="mip-fs__ip">{t("demoIp")}</span>
                    <span className="mip-fs__meta mip-fs__meta--coords">{t("coords")}</span>
                    <span className="mip-fs__meta mip-fs__meta--isp">{t("isp")}</span>
                    <span className="mip-fs__city">{t("city")}</span>
                  </div>
                </div>

                <span className="mip-fs__ok">
                  <span className="mip-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mip-fs__footer">
          <button type="button" className="mip-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="mip-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
