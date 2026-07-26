"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { usePathname } from "@/i18n/navigation";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { useToolIntroChrome } from "@/components/tool-modal/useToolIntroChrome";
import { findToolsDataByPathname } from "@/data/tools-data";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
} from "@/lib/category-accent-colors";
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

function readEmbedFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

/**
 * Parent hard-route shell behind ToolModal — splash must live only in the
 * ?embed=1 iframe. Detected on the client so SSR/embed hydration still shows
 * the cinematic intro inside the modal.
 */
function isModalBackgroundShell(pathname: string, embed: boolean): boolean {
  if (embed || readEmbedFlag()) return false;
  if (typeof window === "undefined") return false;
  return findToolsDataByPathname(pathname) != null;
}

/**
 * Shared phase machine for cinematic tool intro gates:
 * hard routes + embeds, overflow lock while splash is up, Escape/Skip,
 * focus on CTA, and session persistence when persistKey is provided.
 *
 * Hard tool routes always open ToolModal with an ?embed=1 iframe that owns
 * the splash. The parent route still mounts the same IntroGate behind the
 * modal — that background copy is forced to workspace so Get Started cannot
 * leave a duplicate animation over the upload zone.
 */
export function useIntroGatePhase({
  active = true,
  dataAttribute,
  persistKey,
  onPortalReady,
}: UseIntroGatePhaseOptions): UseIntroGatePhaseResult {
  const embed = useToolEmbedMode();
  const pathname = usePathname();
  const backgroundShell = isModalBackgroundShell(pathname, embed);
  const introActive = active && !backgroundShell;
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const [phase, setPhase] = useState<IntroPhase>(() => {
    if (!active) return "workspace";
    // Prefer live embed flag so the iframe never hydrates stuck on workspace.
    if (readEmbedFlag()) {
      return readSeen(persistKey) ? "workspace" : "intro";
    }
    if (typeof window !== "undefined" && findToolsDataByPathname(window.location.pathname)) {
      return "workspace";
    }
    if (typeof window !== "undefined" && readSeen(persistKey)) return "workspace";
    return "intro";
  });
  const [portalReady, setPortalReady] = useState(false);

  const showingIntro = introActive && phase === "intro";

  useToolIntroChrome(showingIntro);

  // Drive shared CTA / shell accents from the tool's category while splash is up.
  useLayoutEffect(() => {
    if (!showingIntro) return;
    const entry = findToolsDataByPathname(pathname);
    const accentId = resolveToolAccentCategoryId(entry?.id);
    if (!accentId) return;

    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--category-accent");
    root.style.setProperty("--category-accent", getCategoryAccentCssVar(accentId));
    return () => {
      if (prev) root.style.setProperty("--category-accent", prev);
      else root.style.removeProperty("--category-accent");
    };
  }, [showingIntro, pathname]);

  useLayoutEffect(() => {
    if (!backgroundShell) return;
    clearIntroChromeLocks(dataAttribute);
    setPhase("workspace");
  }, [backgroundShell, dataAttribute]);

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
    showingIntro,
    startTool,
    ctaRef,
  };
}
