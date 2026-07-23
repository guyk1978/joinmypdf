"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./hash-generator-landing.css";

type IntroPhase = "intro" | "workspace";

type HashGeneratorIntroGateProps = {
  /** When false, children render immediately (non–hash-generator tools). */
  active?: boolean;
  children: ReactNode;
};

const SAMPLE_INPUT = "hello world";
const SAMPLE_HASH = "e3b0c44298fc1c149afbf4c8996fb924";

/**
 * One-way cinematic fullscreen splash for Hash Generator.
 * Input string → security laser → SHA-256 hex digest + algorithm badge.
 * Opaque black cover from first paint prevents tool-control peek-through.
 * Only runs inside the ToolModal CALC embed.
 */
export function HashGeneratorIntroGate({
  active = true,
  children,
}: HashGeneratorIntroGateProps) {
  const embed = useToolEmbedMode();
  const t = useTranslations("HashGeneratorLanding");
  /** Blocks SSR/hydration flash of tool controls before embed mode is known. */
  const [bootstrapped, setBootstrapped] = useState(false);
  const introActive = active && embed;
  const [phase, setPhase] = useState<IntroPhase>("intro");
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    setBootstrapped(true);
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  const splashShowing = Boolean(active && (!bootstrapped || (introActive && phase === "intro")));

  useToolIntroChrome(splashShowing);

  useLayoutEffect(() => {
    if (!splashShowing) return;

    document.documentElement.setAttribute("data-hash-generator-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-hash-generator-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [splashShowing]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  /* Opaque cover during SSR + pre-bootstrap — never render tool UI underneath. */
  if (active && !bootstrapped) {
    return (
      <div
        className="hsh-fs tool-intro-fs hsh-fs--blocker"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
        aria-hidden
      />
    );
  }

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="hsh-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hsh-fs-title"
        style={{ backgroundColor: "#000000", zIndex: 999999 }}
      >
        <header className="hsh-fs__header">
          <h1 id="hsh-fs-title" className="hsh-fs__title">
            <span className="hsh-fs__title-brand">{t("brand")}</span>
            <span className="hsh-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="hsh-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="hsh-fs__stage" aria-hidden>
          <div className="hsh-fs__scene">
            <div className="hsh-fs__workspace animation-workspace">
              <div className="hsh-fs__card">
                <div className="hsh-fs__badges">
                  <span className="hsh-fs__badge hsh-fs__badge--algo">{t("algoBadge")}</span>
                  <span className="hsh-fs__badge hsh-fs__badge--secure">{t("secureBadge")}</span>
                </div>

                <div className="hsh-fs__io">
                  <div className="hsh-fs__input">
                    <span className="hsh-fs__io-label">{t("inputLabel")}</span>
                    <code className="hsh-fs__input-text">{SAMPLE_INPUT}</code>
                    <div className="hsh-fs__laser" />
                  </div>

                  <div className="hsh-fs__output">
                    <span className="hsh-fs__io-label">{t("outputLabel")}</span>
                    <code className="hsh-fs__hash">{SAMPLE_HASH}</code>
                  </div>
                </div>
              </div>

              <span className="hsh-fs__ok">
                <span className="hsh-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="hsh-fs__footer">
          <button type="button" className="hsh-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return (
        <div
          className="hsh-fs tool-intro-fs hsh-fs--blocker"
          style={{ backgroundColor: "#000000", zIndex: 999999 }}
          aria-hidden
        />
      );
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
