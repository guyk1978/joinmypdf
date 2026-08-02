"use client";

import { EVENTS, sanitizeProps, type EventName, type EventProps } from "@/lib/analytics";

type PostHogLike = {
  capture?: (event: string, props?: Record<string, unknown>) => void;
};

/**
 * Fire-and-forget analytics. Uses window.posthog when PostHogProvider has
 * finished its idle init — no static posthog-js import on the critical path.
 */
export function capture(event: EventName, props?: EventProps) {
  try {
    const p = sanitizeProps(props);
    const ph = (globalThis as { posthog?: PostHogLike }).posthog;
    if (ph && typeof ph.capture === "function") {
      ph.capture(event, p);
    }
  } catch {
    /* ignore */
  }
}

export { EVENTS };
