"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import { clearIntroChromeLocks } from "@/lib/intro-gate-chrome";

export type IntroPhase = "intro" | "workspace";

export type UseIntroGatePhaseOptions = {
  /** When false, phase stays on workspace and children render immediately. */
  active?: boolean;
  /** DocumentElement data-* attribute applied while the splash is visible. */
  dataAttribute: string;
  /**
   * sessionStorage key for "seen this intro". When set, returning visitors
   * skip the splash for the rest of the tab session.
   */
  persistKey?: string;
  /** Optional work once the portal target is ready. */
  onPortalReady?: () => void;
};

export type UseIntroGatePhaseResult = {
  introActive: boolean;
  phase: IntroPhase;
  portalReady: boolean;
  showingIntro: boolean;
  startTool: () => void;
  /** Attach to the primary Get Started CTA for initial focus. */
  ctaRef: RefObject<HTMLButtonElement | null>;
};

function readSeen(persistKey?: string): boolean {
  if (!persistKey || typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(persistKey) === "1";
  } catch {
    return false;
  }
}

function writeSeen(persistKey?: string) {
  if (!persistKey) return;
  try {
    window.sessionStorage.setItem(persistKey, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Shared phase machine for cinematic tool intro gates:
 * hard routes + embeds, overflow lock while splash is up, Escape/Skip,
 * focus on CTA, and session persistence when persistKey is provided.
 */
export function useIntroGatePhase({
  active = true,
  dataAttribute,
  persistKey,
  onPortalReady,
}: UseIntroGatePhaseOptions): UseIntroGatePhaseResult {
  const introActive = active;
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const [phase, setPhase] = useState<IntroPhase>(() => {
    if (!introActive) return "workspace";
    if (typeof window !== "undefined" && readSeen(persistKey)) return "workspace";
    return "intro";
  });
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
    if (introActive && readSeen(persistKey)) {
      setPhase("workspace");
    }
    onPortalReady?.();
    setPortalReady(true);
    // Intentionally once on mount — onPortalReady is for one-shot cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only portal bootstrap
  }, []);

  useEffect(() => {
    if (!introActive) {
      clearIntroChromeLocks(dataAttribute);
      setPhase("workspace");
    }
  }, [introActive, dataAttribute]);

  useEffect(() => {
    if (!introActive || phase !== "intro") return;

    document.documentElement.setAttribute(dataAttribute, "1");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      ctaRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      writeSeen(persistKey);
      clearIntroChromeLocks(dataAttribute);
      setPhase("workspace");
    };
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown, true);
      document.documentElement.removeAttribute(dataAttribute);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase, dataAttribute, persistKey]);

  const startTool = useCallback(() => {
    writeSeen(persistKey);
    clearIntroChromeLocks(dataAttribute);
    setPhase("workspace");
  }, [dataAttribute, persistKey]);

  return {
    introActive,
    phase,
    portalReady,
    showingIntro: introActive && phase === "intro",
    startTool,
    ctaRef,
  };
}
