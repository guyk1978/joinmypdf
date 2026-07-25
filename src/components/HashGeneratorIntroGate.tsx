"use client";

import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useIntroGatePhase } from "@/hooks/useIntroGatePhase";
import "./hash-generator-landing.css";

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
 * Shows before the workspace (embed modal and dedicated tool page).
 */
export function HashGeneratorIntroGate({
  active = true,
  children,
}: HashGeneratorIntroGateProps) {
  const { introActive, phase, portalReady, startTool } = useIntroGatePhase({
    active,
    dataAttribute: "data-hash-generator-intro",
  });
  const t = useTranslations("HashGeneratorLanding");

  /* Opaque cover during SSR + pre-bootstrap — never render tool UI underneath. */
  if (active && !portalReady) {
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
