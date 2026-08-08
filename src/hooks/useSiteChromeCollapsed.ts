"use client";

import { useCallback, useEffect, useState } from "react";

export const SITE_HEADER_COLLAPSE_KEY = "joinmypdf:site-header-collapsed";
export const SITE_FOOTER_COLLAPSE_KEY = "joinmypdf:site-footer-collapsed";
export const SITE_HEADER_COLLAPSE_ATTR = "data-site-header-collapsed";
export const SITE_FOOTER_COLLAPSE_ATTR = "data-site-footer-collapsed";
export const SITE_CHROME_RESTORE_SIZE = "1.75rem";

type ChromeEdge = "header" | "footer";

function storageKey(edge: ChromeEdge) {
  return edge === "header" ? SITE_HEADER_COLLAPSE_KEY : SITE_FOOTER_COLLAPSE_KEY;
}

function attrName(edge: ChromeEdge) {
  return edge === "header" ? SITE_HEADER_COLLAPSE_ATTR : SITE_FOOTER_COLLAPSE_ATTR;
}

function readStored(edge: ChromeEdge): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(edge)) === "1";
  } catch {
    return false;
  }
}

function publishChromeState(edge: ChromeEdge, collapsed: boolean) {
  const root = document.documentElement;
  root.setAttribute(attrName(edge), collapsed ? "1" : "0");

  if (edge === "header") {
    if (collapsed) {
      root.style.setProperty("--site-header-height", SITE_CHROME_RESTORE_SIZE);
    } else {
      root.style.removeProperty("--site-header-height");
    }
  } else if (collapsed) {
    root.style.setProperty("--site-footer-height", SITE_CHROME_RESTORE_SIZE);
    root.style.setProperty("--site-footer-reveal-height", SITE_CHROME_RESTORE_SIZE);
  } else {
    // HomePageFooter ResizeObserver republishes the real height on expand.
    root.style.removeProperty("--site-footer-height");
    root.style.removeProperty("--site-footer-reveal-height");
  }

  window.dispatchEvent(new Event("resize"));
}

/**
 * Persist header/footer collapse and sync html data attrs + layout CSS vars
 * so the workspace can expand into freed vertical space.
 */
export function useSiteChromeCollapsed(edge: ChromeEdge) {
  const [collapsed, setCollapsedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readStored(edge);
    setCollapsedState(initial);
    publishChromeState(edge, initial);
    setReady(true);
  }, [edge]);

  const setCollapsed = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setCollapsedState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        try {
          window.localStorage.setItem(storageKey(edge), value ? "1" : "0");
        } catch {
          // ignore quota / private mode
        }
        publishChromeState(edge, value);
        return value;
      });
    },
    [edge],
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  return { collapsed, setCollapsed, toggle, ready };
}
