"use client";

import { useEffect } from "react";

async function clearStalePwaCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

/** Registers /sw.js in production; clears stale SW caches during local dev. */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        await clearStalePwaCaches();
      })();
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Non-fatal — install UI still works where SW is optional */
    });
  }, []);

  return null;
}
