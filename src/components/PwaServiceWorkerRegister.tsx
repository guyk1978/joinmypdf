"use client";

import { useEffect } from "react";

/** Registers /sw.js so Chrome can fire beforeinstallprompt (PWA install). */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Non-fatal — install UI still works where SW is optional */
    });
  }, []);

  return null;
}
