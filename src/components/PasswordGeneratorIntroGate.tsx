"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./password-generator-landing.css";

type IntroPhase = "intro" | "workspace";

type PasswordGeneratorIntroGateProps = {
  /** When false, children render immediately (non–password-generator tools). */
  active?: boolean;
  children: ReactNode;
};

const GLYPHS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*?_+=";

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
}

function scrambleLike(target: string) {
  return Array.from(target, () => randomGlyph()).join("");
}

/**
 * One-way cinematic fullscreen splash for Password Generator.
 * Scrambling glyphs → slot into strong password + 100% strength meter.
 * Only runs inside the ToolModal CALC embed.
 */
export function PasswordGeneratorIntroGate({
  active = true,
  children,
}: PasswordGeneratorIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("PasswordGeneratorLanding");
  const finalPassword = t("passwordSample");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);
  const [scrambleText, setScrambleText] = useState(() => scrambleLike(finalPassword));

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-password-generator-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-password-generator-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScrambleText(finalPassword);
      return;
    }

    const cycleMs = 8500;
    let raf = 0;
    let timeoutId = 0;
    let start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) % cycleMs;
      // Rapid scramble for first ~2.8s of each loop, then settle on final
      if (elapsed < 2800) {
        setScrambleText(scrambleLike(finalPassword));
        timeoutId = window.setTimeout(() => {
          raf = requestAnimationFrame(tick);
        }, 55);
      } else {
        setScrambleText(finalPassword);
        const remaining = cycleMs - elapsed;
        timeoutId = window.setTimeout(() => {
          start = performance.now();
          raf = requestAnimationFrame(tick);
        }, remaining);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [introActive, phase, finalPassword]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const splash = (
      <div
        className="pwg-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwg-fs-title"
      >
        <header className="pwg-fs__header">
          <h1 id="pwg-fs-title" className="pwg-fs__title">
            <span className="pwg-fs__title-brand">{t("brand")}</span>
            <span className="pwg-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="pwg-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="pwg-fs__stage" aria-hidden>
          <div className="pwg-fs__scene">
            <div className="pwg-fs__workspace animation-workspace">
              <div className="pwg-fs__card">
                <div className="pwg-fs__badges">
                  <span className="pwg-fs__badge pwg-fs__badge--len">{t("lengthBadge")}</span>
                  <span className="pwg-fs__badge pwg-fs__badge--secure">{t("secureBadge")}</span>
                </div>

                <div className="pwg-fs__display">
                  <span className="pwg-fs__scramble">{scrambleText}</span>
                  <span className="pwg-fs__final">{finalPassword}</span>
                </div>

                <div className="pwg-fs__meter">
                  <div className="pwg-fs__meter-track">
                    <div className="pwg-fs__meter-fill" />
                  </div>
                  <span className="pwg-fs__meter-label">{t("strengthLabel")}</span>
                </div>
              </div>

              <span className="pwg-fs__ok">
                <span className="pwg-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="pwg-fs__footer">
          <button type="button" className="pwg-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="pwg-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
