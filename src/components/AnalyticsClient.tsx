"use client";

import posthog from "posthog-js";
import { EVENTS, sanitizeProps, type EventName, type EventProps } from "@/lib/analytics";

export function capture(event: EventName, props?: EventProps) {
  try {
    const p = sanitizeProps(props);
    if (typeof posthog.capture === "function") {
      posthog.capture(event, p);
    }
  } catch {
    /* ignore */
  }
}

export { EVENTS };
