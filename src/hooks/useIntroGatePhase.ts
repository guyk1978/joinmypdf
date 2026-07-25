"use client";

import { useCallback, useEffect, useState } from "react";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import { clearIntroChromeLocks } from "@/lib/intro-gate-chrome";

export type IntroPhase = "intro" | "workspace";

export type UseIntroGatePhaseOptions = {
  /** When false, phase stays on workspace and children render immediately. */
  active?: boolean;
  /** DocumentElement data-* attribute applied while the splash is visible. */
  dataAttribute: string;
  /** Optional work once the portal target is ready (e.g. clear stale skip flags). */
  onPortalReady?: () => void;
};

export type UseIntroGatePhaseResult = {
  introActive: boolean;
  phase: IntroPhase;
  portalReady: boolean;
  showingIntro: boolean;
  startTool: () => void;
};

/**
 * Shared phase machine for cinematic tool intro gates:
 * hard routes + embeds, overflow lock while splash is up, and synchronous
 * chrome-lock clear on Get Started.
 */
export function useIntroGatePhase({
  active = true,
  dataAttribute,
  onPortalReady,
}: UseIntroGatePhaseOptions): UseIntroGatePhaseResult {
  const introActive = active;
  const [phase, setPhase] = useState<IntroPhase>(introActive ? "intro" : "workspace");
  const [portalReady, setPortalReady] = useState(false);

  useToolIntroChrome(introActive && phase === "intro");

  useEffect(() => {
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

    return () => {
      document.documentElement.removeAttribute(dataAttribute);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introActive, phase, dataAttribute]);

  const startTool = useCallback(() => {
    clearIntroChromeLocks(dataAttribute);
    setPhase("workspace");
  }, [dataAttribute]);

  return {
    introActive,
    phase,
    portalReady,
    showingIntro: introActive && phase === "intro",
    startTool,
  };
}
