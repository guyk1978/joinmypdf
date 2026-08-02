"use client";

import { useEffect, useState } from "react";
import { CookieConsent } from "@/components/CookieConsent";

/**
 * Mount cookie UI after first paint so it does not compete with splash LCP / TBT.
 */
export function DeferredCookieConsent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const start = () => setReady(true);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(start, 1200);
    }

    return () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <CookieConsent />;
}
