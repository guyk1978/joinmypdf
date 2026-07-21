"use client";

/**
 * Sitewide loupe visibility + lens size preference shared between the
 * tool-modal header (parent document) and tool workspaces in the embed iframe.
 * localStorage `storage` events propagate toggles across same-origin frames.
 */

const ENABLED_KEY = "joinmypdf:magnifier-enabled";
const ENABLED_EVENT = "joinmypdf:magnifier-preference";

const SIZE_KEY = "joinmypdf:magnifier-size";
const SIZE_EVENT = "joinmypdf:magnifier-size";

export type MagnifierSizeTier = "small" | "medium" | "huge";

export const MAGNIFIER_SIZE_TIERS: readonly MagnifierSizeTier[] = [
  "small",
  "medium",
  "huge",
] as const;

const DEFAULT_TIER: MagnifierSizeTier = "medium";

function isSizeTier(value: unknown): value is MagnifierSizeTier {
  return value === "small" || value === "medium" || value === "huge";
}

export function getMagnifierPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setMagnifierPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Storage unavailable — same-window listeners still get the event below.
  }
  window.dispatchEvent(new CustomEvent(ENABLED_EVENT, { detail: enabled }));
}

export function subscribeMagnifierPreference(
  callback: (enabled: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = (event: Event) => {
    callback(Boolean((event as CustomEvent).detail));
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ENABLED_KEY) return;
    callback(event.newValue !== "0");
  };

  window.addEventListener(ENABLED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ENABLED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function getMagnifierSizeTier(): MagnifierSizeTier {
  if (typeof window === "undefined") return DEFAULT_TIER;
  try {
    const raw = window.localStorage.getItem(SIZE_KEY);
    return isSizeTier(raw) ? raw : DEFAULT_TIER;
  } catch {
    return DEFAULT_TIER;
  }
}

export function setMagnifierSizeTier(tier: MagnifierSizeTier) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIZE_KEY, tier);
  } catch {
    // Storage unavailable — same-window listeners still get the event below.
  }
  window.dispatchEvent(new CustomEvent(SIZE_EVENT, { detail: tier }));
}

export function subscribeMagnifierSizeTier(
  callback: (tier: MagnifierSizeTier) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    callback(isSizeTier(detail) ? detail : DEFAULT_TIER);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SIZE_KEY) return;
    callback(isSizeTier(event.newValue) ? event.newValue : DEFAULT_TIER);
  };

  window.addEventListener(SIZE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SIZE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Global diameter multiplier applied to every loupe size tier and to
 * per-tool `size` props so image + document magnifiers stay uniform.
 */
export const MAGNIFIER_LOUPE_SCALE = 2;

/**
 * Resolve lens diameter in CSS pixels for the selected tier.
 * Huge covers a large share of the viewport for effortless inspection.
 * All tiers are scaled by {@link MAGNIFIER_LOUPE_SCALE} (2× diameter).
 */
export function resolveMagnifierLensSizePx(
  tier: MagnifierSizeTier,
  viewportMin = typeof window !== "undefined"
    ? Math.min(window.innerWidth, window.innerHeight)
    : 800,
): number {
  const scale = MAGNIFIER_LOUPE_SCALE;
  switch (tier) {
    case "small":
      return Math.round(112 * scale);
    case "huge": {
      // Base huge lens, then 2× — clamped so it still fits on screen.
      const base = Math.round(Math.min(560, Math.max(340, viewportMin * 0.55)));
      return Math.round(Math.min(viewportMin * 0.92, base * scale));
    }
    case "medium":
    default:
      return Math.round(188 * scale);
  }
}
