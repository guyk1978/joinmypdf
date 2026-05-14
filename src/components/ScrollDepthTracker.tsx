"use client";

import { useEffect } from "react";
import { capture, EVENTS } from "@/components/AnalyticsClient";

export function ScrollDepthTracker() {
  useEffect(() => {
    const marks = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const h = doc.scrollHeight - doc.clientHeight;
      if (h <= 0) return;
      const pct = (doc.scrollTop / h) * 100;
      for (const th of [50, 75, 100] as const) {
        if (pct >= th && !marks.has(th)) {
          marks.add(th);
          capture(EVENTS.scroll_depth, { percent: th });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}
