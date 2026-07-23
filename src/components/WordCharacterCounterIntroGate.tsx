"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import "./word-character-counter-landing.css";

type IntroPhase = "intro" | "workspace";

type WordCharacterCounterIntroGateProps = {
  /** When false, children render immediately (non–word-character-counter tools). */
  active?: boolean;
  children: ReactNode;
};

const SAMPLE_TEXT =
  "Count every word. Measure characters.\nShip clearer copy in seconds.";

function countStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const characters = text.length;
  const sentences = (text.match(/[.!?]+/g) ?? []).length;
  const readingMin = Math.max(1, Math.ceil(words / 200)) || 0;
  return { words, characters, sentences, readingMin: trimmed ? readingMin : 0 };
}

/**
 * One-way cinematic fullscreen splash for Word & Character Counter.
 * Text types into editor while Words / Characters / Sentences / Reading Time tick up.
 * Only runs inside the ToolModal CALC embed.
 */
export function WordCharacterCounterIntroGate({
  active = true,
  children,
}: WordCharacterCounterIntroGateProps) {
  const embed = useToolEmbedMode();
  const introActive = active && embed;
  const t = useTranslations("WordCharacterCounterLanding");
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);
  const [typed, setTyped] = useState("");

  const stats = useMemo(() => countStats(typed), [typed]);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!introActive) setPhase("workspace");
  }, [introActive]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute("data-word-character-counter-intro", "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-word-character-counter-intro");
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(SAMPLE_TEXT);
      return;
    }

    const cycleMs = 9000;
    const typeMs = 4200;
    const holdMs = 2800;
    let timeoutId = 0;
    let start = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - start) % cycleMs;
      if (elapsed < typeMs) {
        const progress = elapsed / typeMs;
        const len = Math.min(SAMPLE_TEXT.length, Math.floor(progress * SAMPLE_TEXT.length) + 1);
        setTyped(SAMPLE_TEXT.slice(0, len));
        timeoutId = window.setTimeout(tick, 38);
      } else if (elapsed < typeMs + holdMs) {
        setTyped(SAMPLE_TEXT);
        timeoutId = window.setTimeout(tick, 120);
      } else {
        setTyped("");
        const remaining = cycleMs - elapsed;
        timeoutId = window.setTimeout(() => {
          start = performance.now();
          tick();
        }, Math.max(40, remaining));
      }
    };

    tick();
    return () => window.clearTimeout(timeoutId);
  }, [introActive, phase]);

  const startTool = useCallback(() => {
    setPhase("workspace");
  }, []);

  if (!introActive) return <>{children}</>;

  if (phase === "intro") {
    const complete = typed.length >= SAMPLE_TEXT.length;
    const splash = (
      <div
        className="wcc-fs tool-intro-fs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wcc-fs-title"
      >
        <header className="wcc-fs__header">
          <h1 id="wcc-fs-title" className="wcc-fs__title">
            <span className="wcc-fs__title-brand">{t("brand")}</span>
            <span className="wcc-fs__title-rest"> {t("titleRest")}</span>
          </h1>
          <p className="wcc-fs__subtitle">{t("subtitle")}</p>
        </header>

        <div className="wcc-fs__stage" aria-hidden>
          <div className="wcc-fs__scene">
            <div className="wcc-fs__workspace animation-workspace">
              <div className={`wcc-fs__card${complete ? " wcc-fs__card--done" : ""}`}>
                <div className="wcc-fs__editor">
                  <span className="wcc-fs__editor-label">{t("editorLabel")}</span>
                  <p className="wcc-fs__typed">
                    {typed}
                    <span className="wcc-fs__caret" />
                  </p>
                </div>

                <div className="wcc-fs__metrics">
                  <div className="wcc-fs__metric wcc-fs__metric--words">
                    <span className="wcc-fs__metric-val">{stats.words}</span>
                    <span className="wcc-fs__metric-label">{t("words")}</span>
                  </div>
                  <div className="wcc-fs__metric wcc-fs__metric--chars">
                    <span className="wcc-fs__metric-val">{stats.characters}</span>
                    <span className="wcc-fs__metric-label">{t("characters")}</span>
                  </div>
                  <div className="wcc-fs__metric wcc-fs__metric--sent">
                    <span className="wcc-fs__metric-val">{stats.sentences}</span>
                    <span className="wcc-fs__metric-label">{t("sentences")}</span>
                  </div>
                  <div className="wcc-fs__metric wcc-fs__metric--time">
                    <span className="wcc-fs__metric-val">
                      {stats.readingMin}
                      <span className="wcc-fs__metric-unit">m</span>
                    </span>
                    <span className="wcc-fs__metric-label">{t("readingTime")}</span>
                  </div>
                </div>
              </div>

              <span className={`wcc-fs__ok${complete ? " wcc-fs__ok--show" : ""}`}>
                <span className="wcc-fs__check" />
                {t("success")}
              </span>
            </div>
          </div>
        </div>

        <div className="wcc-fs__footer">
          <button type="button" className="wcc-fs__cta" onClick={startTool}>
            {t("getStarted")}
          </button>
        </div>
      </div>
    );

    if (!portalReady) {
      return <div className="wcc-fs tool-intro-fs" aria-hidden />;
    }
    return createPortal(splash, document.body);
  }

  return <>{children}</>;
}
