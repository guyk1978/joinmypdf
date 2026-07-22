"use client";

import { useEffect } from "react";

const VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";

function ensureViewportMeta() {
  if (typeof document === "undefined") return;
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    document.head.appendChild(meta);
  }
  const current = meta.getAttribute("content") ?? "";
  if (current === VIEWPORT_CONTENT) {
    // iOS / BFCache can keep a stale visual scale; briefly re-assert the meta.
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
    );
  }
  meta.setAttribute("content", VIEWPORT_CONTENT);
}

function syncViewportCssVars() {
  const root = document.documentElement;
  const vv = window.visualViewport;
  const width = Math.round(vv?.width ?? window.innerWidth);
  const height = Math.round(vv?.height ?? window.innerHeight);
  root.style.setProperty("--app-vv-width", `${width}px`);
  root.style.setProperty("--app-vv-height", `${height}px`);
  root.style.setProperty("--app-vh", `${height * 0.01}px`);
}

function clearStaleScrollLocks() {
  const root = document.documentElement;
  if (root.getAttribute("data-tool-modal-open") === "1") return;

  const introLocked = Array.from(root.attributes).some(
    (attr) =>
      attr.name.startsWith("data-") &&
      attr.name.endsWith("-intro") &&
      attr.value === "1",
  );
  if (introLocked) return;

  // BFCache can restore body padding/overflow left by a closed modal.
  if (document.body.style.paddingRight) {
    document.body.style.paddingRight = "";
  }
}

function recoverLayout() {
  ensureViewportMeta();
  clearStaleScrollLocks();
  syncViewportCssVars();

  const root = document.documentElement;
  root.classList.add("viewport-recovering");
  // Force style + layout recalculation after history restoration.
  void root.offsetHeight;
  window.dispatchEvent(new Event("resize"));
  window.visualViewport?.dispatchEvent(new Event("resize"));

  requestAnimationFrame(() => {
    syncViewportCssVars();
    root.classList.remove("viewport-recovering");
  });
}

/**
 * Keeps viewport scale and layout metrics consistent across browser Back/Forward
 * (popstate + BFCache pageshow with event.persisted).
 */
export function ViewportHistoryRecovery() {
  useEffect(() => {
    ensureViewportMeta();
    syncViewportCssVars();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        recoverLayout();
      }
    };

    const onPopState = () => {
      requestAnimationFrame(() => recoverLayout());
    };

    const onVvChange = () => syncViewportCssVars();

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    window.visualViewport?.addEventListener("resize", onVvChange);
    window.visualViewport?.addEventListener("scroll", onVvChange);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
      window.visualViewport?.removeEventListener("resize", onVvChange);
      window.visualViewport?.removeEventListener("scroll", onVvChange);
    };
  }, []);

  return null;
}
