"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./png-to-ico-landing.css";

type IntroPhase = "intro" | "workspace";

type PngToIcoIntroGateProps = {
  /** When false, children render immediately (non–png-to-ico tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free PNG to ICO Converter.
 * PNG logo → multi-size favicon grid → browser tab snap-in + ICO Ready.
 * Shows before the upload workspace (embed modal and dedicated tool page).
 */
export function PngToIcoIntroGate({
  active = true,
  children,
}: PngToIcoIntroGateProps) {
  const introActive = active;
  const t = useTranslations("PngToIcoLanding");
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

    document.documentElement.setAttribute("data-png-to-ico-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-png-to-ico-intro");
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
        className="p2i-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="p2i-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="p2i-fs__header">
          <h1 id="p2i-fs-title" className="p2i-fs__title">
            <span className="p2i-fs__title-brand">{t("brand")}</span>
            <span className="p2i-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="p2i-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="p2i-fs__stage" aria-hidden>
          <div className="p2i-fs__scene">
            <div className="p2i-fs__workspace animation-workspace" data-splash-wide>
              <div className="p2i-fs__engine">
                <div className="p2i-fs__status-row">
                  <span className="p2i-fs__pill p2i-fs__pill--png">{t("pngBadge")}</span>
                  <span className="p2i-fs__status-line" />
                  <span className="p2i-fs__pill p2i-fs__pill--ico">{t("icoBadge")}</span>
                </div>

                <div className="p2i-fs__body">
                  {/* Source PNG + size grid */}
                  <div className="p2i-fs__pack">
                    <div className="p2i-fs__source">
                      <span className="p2i-fs__logo" />
                      <span className="p2i-fs__source-label">{t("sourceLabel")}</span>
                    </div>

                    <div className="p2i-fs__sizes">
                      <div className="p2i-fs__size p2i-fs__size--16">
                        <span className="p2i-fs__size-icon" />
                        <span className="p2i-fs__size-label">{t("size16")}</span>
                      </div>
                      <div className="p2i-fs__size p2i-fs__size--32">
                        <span className="p2i-fs__size-icon" />
                        <span className="p2i-fs__size-label">{t("size32")}</span>
                      </div>
                      <div className="p2i-fs__size p2i-fs__size--48">
                        <span className="p2i-fs__size-icon" />
                        <span className="p2i-fs__size-label">{t("size48")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Browser tab preview */}
                  <div className="p2i-fs__browser">
                    <div className="p2i-fs__chrome">
                      <span className="p2i-fs__dot" />
                      <span className="p2i-fs__dot" />
                      <span className="p2i-fs__dot" />
                    </div>
                    <div className="p2i-fs__tabs">
                      <div className="p2i-fs__tab p2i-fs__tab--active">
                        <span className="p2i-fs__favicon" />
                        <span className="p2i-fs__tab-title">{t("tabTitle")}</span>
                      </div>
                      <div className="p2i-fs__tab p2i-fs__tab--idle">
                        <span className="p2i-fs__tab-title">{t("tabIdle")}</span>
                      </div>
                    </div>
                    <div className="p2i-fs__address">
                      <span className="p2i-fs__lock" />
                      <span>{t("urlHint")}</span>
                    </div>
                    <span className="p2i-fs__pack-label">{t("packLabel")}</span>
                  </div>
                </div>

                <div className="p2i-fs__particles">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <span className="p2i-fs__ok">
                <span className="p2i-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="p2i-fs__footer">
          <button type="button" className="p2i-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="p2i-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
