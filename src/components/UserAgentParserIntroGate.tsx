"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./user-agent-parser-landing.css";

type IntroPhase = "intro" | "workspace";

type UserAgentParserIntroGateProps = {
  /** When false, children render immediately (non–user-agent-parser tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for Free User Agent Parser Online.
 * Laser scans a raw UA string → Browser / OS / Device cards + ID badges.
 * Only runs inside the ToolModal CALC embed.
 */
export function UserAgentParserIntroGate({
  active = true,
  children,
}: UserAgentParserIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("UserAgentParserLanding");
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

    document.documentElement.setAttribute("data-user-agent-parser-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-user-agent-parser-intro");
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
        className="uap-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="uap-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="uap-fs__header">
          <h1 id="uap-fs-title" className="uap-fs__title">
            <span className="uap-fs__title-brand">{t("brand")}</span>
            <span className="uap-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="uap-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="uap-fs__stage" aria-hidden>
          <div className="uap-fs__scene">
            <div className="uap-fs__workspace animation-workspace">
              <div className="uap-fs__card">
                <div className="uap-fs__badges">
                  <span className="uap-fs__badge uap-fs__badge--browser">{t("badgeBrowser")}</span>
                  <span className="uap-fs__pipe" />
                  <span className="uap-fs__badge uap-fs__badge--os">{t("badgeOs")}</span>
                  <span className="uap-fs__pipe uap-fs__pipe--late" />
                  <span className="uap-fs__badge uap-fs__badge--device">{t("badgeDevice")}</span>
                </div>

                <div className="uap-fs__terminal">
                  <div className="uap-fs__chrome">
                    <span className="uap-fs__dot" />
                    <span className="uap-fs__dot" />
                    <span className="uap-fs__dot" />
                    <span className="uap-fs__prompt">{t("prompt")}</span>
                  </div>
                  <p className="uap-fs__ua">{t("uaSample")}</p>
                  <span className="uap-fs__laser" />
                </div>

                <div className="uap-fs__parts">
                  <div className="uap-fs__part uap-fs__part--browser">
                    <span className="uap-fs__part-label">{t("partBrowser")}</span>
                    <span className="uap-fs__part-value">{t("badgeBrowser")}</span>
                  </div>
                  <div className="uap-fs__part uap-fs__part--os">
                    <span className="uap-fs__part-label">{t("partOs")}</span>
                    <span className="uap-fs__part-value">{t("badgeOs")}</span>
                  </div>
                  <div className="uap-fs__part uap-fs__part--device">
                    <span className="uap-fs__part-label">{t("partDevice")}</span>
                    <span className="uap-fs__part-value">{t("badgeDevice")}</span>
                  </div>
                </div>
              </div>

              <span className="uap-fs__ok">
                <span className="uap-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="uap-fs__footer">
          <button type="button" className="uap-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="uap-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
