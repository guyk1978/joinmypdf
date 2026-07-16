"use client";

import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useReducedMotion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

export type PageTransitionPhase = "idle" | "exiting" | "entering";

type PageTransitionContextValue = {
  phase: PageTransitionPhase;
  transitionNavigate: (href: string) => void;
  onExitAnimationComplete: () => void;
  onEnterAnimationComplete: () => void;
  handleLinkClickCapture: (event: MouseEvent<HTMLElement>) => void;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

function normalizeInternalPath(href: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;

    const path = stripLocalePrefix(url.pathname);
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;
    return `${normalizedPath}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function pathsEqual(a: string, b: string): boolean {
  const strip = (value: string) => {
    const base = value.split(/[?#]/)[0] || "/";
    return base.endsWith("/") ? base : `${base}/`;
  };
  return strip(a) === strip(b);
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<PageTransitionPhase>("idle");
  const phaseRef = useRef<PageTransitionPhase>("idle");
  const pendingTargetRef = useRef<string | null>(null);
  const awaitingPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const awaited = awaitingPathnameRef.current;
    if (!awaited) return;
    if (pathsEqual(pathname, awaited)) {
      awaitingPathnameRef.current = null;
      setPhase("entering");
    }
  }, [pathname]);

  const transitionNavigate = useCallback(
    (href: string) => {
      const target = normalizeInternalPath(href);
      if (!target || pathsEqual(target, pathname)) return;
      if (phaseRef.current !== "idle") return;

      if (reduceMotion) {
        router.push(target);
        return;
      }

      pendingTargetRef.current = target;
      setPhase("exiting");
    },
    [pathname, reduceMotion, router],
  );

  const onExitAnimationComplete = useCallback(() => {
    if (phaseRef.current !== "exiting") return;

    const target = pendingTargetRef.current;
    if (!target) {
      setPhase("idle");
      return;
    }

    pendingTargetRef.current = null;
    awaitingPathnameRef.current = target;
    router.push(target);
  }, [router]);

  const onEnterAnimationComplete = useCallback(() => {
    if (phaseRef.current !== "entering") return;
    setPhase("idle");
  }, []);

  const handleLinkClickCapture = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      // Industrial tool cards open ToolModal — skip page transition navigation.
      if (anchor.hasAttribute("data-tool-modal-open")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const target = normalizeInternalPath(href);
      if (!target) return;
      if (pathsEqual(target, pathname)) {
        event.preventDefault();
        return;
      }

      if (phaseRef.current !== "idle") {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      transitionNavigate(href);
    },
    [pathname, transitionNavigate],
  );

  const value = useMemo(
    () => ({
      phase,
      transitionNavigate,
      onExitAnimationComplete,
      onEnterAnimationComplete,
      handleLinkClickCapture,
    }),
    [phase, transitionNavigate, onExitAnimationComplete, onEnterAnimationComplete, handleLinkClickCapture],
  );

  return <PageTransitionContext.Provider value={value}>{children}</PageTransitionContext.Provider>;
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within PageTransitionProvider");
  }
  return context;
}
