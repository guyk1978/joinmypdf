"use client";

/**
 * Sitewide loupe visibility preference shared between the tool-modal header
 * (parent document) and tool workspaces rendered inside the embed iframe.
 * localStorage `storage` events propagate the toggle across same-origin frames.
 */
const STORAGE_KEY = "joinmypdf:magnifier-enabled";
const CHANGE_EVENT = "joinmypdf:magnifier-preference";

export function getMagnifierPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setMagnifierPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Storage unavailable — same-window listeners still get the event below.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: enabled }));
}

export function subscribeMagnifierPreference(
  callback: (enabled: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = (event: Event) => {
    callback(Boolean((event as CustomEvent).detail));
  };
  // Fires in other same-origin windows/iframes when the parent toggles.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    callback(event.newValue !== "0");
  };

  window.addEventListener(CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
