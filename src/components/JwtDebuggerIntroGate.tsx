"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./jwt-debugger-landing.css";

type IntroPhase = "intro" | "workspace";

type JwtDebuggerIntroGateProps = {
  /** When false, children render immediately (non–jwt-debugger tools). */
  active?: boolean;
  children: ReactNode;
};

/**
 * One-way cinematic fullscreen splash for JWT Decoder Online.
 * Encoded token → crypto split engine → Header / Payload / Signature JSON → success.
 * Shows before the decoder workspace (embed modal and dedicated tool page).
 */
export function JwtDebuggerIntroGate({
  active = true,
  children,
}: JwtDebuggerIntroGateProps) {
  const introActive = active;
  const t = useTranslations("JwtDebuggerLanding");
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

    document.documentElement.setAttribute("data-jwt-debugger-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-jwt-debugger-intro");
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
        className="jwt-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jwt-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="jwt-fs__header">
          <h1 id="jwt-fs-title" className="jwt-fs__title">
            <span className="jwt-fs__title-brand">{t("brand")}</span>
            <span className="jwt-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="jwt-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="jwt-fs__stage" aria-hidden>
          <div className="jwt-fs__scene">
            <div className="jwt-fs__workspace animation-workspace">
              <div className="jwt-fs__card">
                <div className="jwt-fs__pipeline">
                  <div className="jwt-fs__pane jwt-fs__pane--token">
                    <span className="jwt-fs__tag">{t("tokenTag")}</span>
                    <div className="jwt-fs__token">
                      <p className="jwt-fs__token-line jwt-fs__token-line--1">
                        <span className="jwt-fs__seg jwt-fs__seg--h">eyJhbGciOiJIUzI1NiIs</span>
                      </p>
                      <p className="jwt-fs__token-line jwt-fs__token-line--2">
                        <span className="jwt-fs__dot">.</span>
                        <span className="jwt-fs__seg jwt-fs__seg--p">eyJzdWIiOiIxMjM0NTY</span>
                      </p>
                      <p className="jwt-fs__token-line jwt-fs__token-line--3">
                        <span className="jwt-fs__dot">.</span>
                        <span className="jwt-fs__seg jwt-fs__seg--s">SflKxwRJSMeKKF2QT</span>
                      </p>
                      <p className="jwt-fs__token-line jwt-fs__token-line--4">
                        <span className="jwt-fs__seg jwt-fs__seg--trunc">{t("tokenSample")}</span>
                      </p>
                      <span className="jwt-fs__laser" />
                    </div>
                  </div>

                  <div className="jwt-fs__engine">
                    <span className="jwt-fs__flow" />
                    <span className="jwt-fs__core" />
                    <span className="jwt-fs__badge">{t("algBadge")}</span>
                  </div>

                  <div className="jwt-fs__pane jwt-fs__pane--parts">
                    <span className="jwt-fs__tag jwt-fs__tag--parts">{t("partsTag")}</span>
                    <div className="jwt-fs__parts">
                      <div className="jwt-fs__part jwt-fs__part--h">
                        <span className="jwt-fs__part-label">{t("header")}</span>
                        <code className="jwt-fs__part-json">
                          {"{"}&quot;alg&quot;:&quot;HS256&quot;{"}"}
                        </code>
                      </div>
                      <div className="jwt-fs__part jwt-fs__part--p">
                        <span className="jwt-fs__part-label">{t("payload")}</span>
                        <code className="jwt-fs__part-json">
                          {"{"}&quot;sub&quot;:&quot;123&quot;{"}"}
                        </code>
                      </div>
                      <div className="jwt-fs__part jwt-fs__part--s">
                        <span className="jwt-fs__part-label">{t("signature")}</span>
                        <code className="jwt-fs__part-json">SflKxwRJ…</code>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="jwt-fs__particle jwt-fs__particle--1" />
                <span className="jwt-fs__particle jwt-fs__particle--2" />
                <span className="jwt-fs__particle jwt-fs__particle--3" />

                <span className="jwt-fs__ok">
                  <span className="jwt-fs__check" />
                  {t("success")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="jwt-fs__footer">
          <button type="button" className="jwt-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="jwt-fs tool-intro-fs"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
