"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Lock, WifiOff } from "lucide-react";

export type HtmlMarkdownLocalFirstBarLabels = {
  localFirstBadge: string;
  offlineReady: string;
  clearAllButton: string;
};

type HtmlMarkdownLocalFirstBarProps = {
  labels: HtmlMarkdownLocalFirstBarLabels;
  onClearAll: () => void;
  className?: string;
};

export function HtmlMarkdownLocalFirstBar({
  labels,
  onClearAll,
  className,
}: HtmlMarkdownLocalFirstBarProps) {
  const [offlineCapable, setOfflineCapable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncOffline = () => setIsOffline(!navigator.onLine);
    syncOffline();

    window.addEventListener("online", syncOffline);
    window.addEventListener("offline", syncOffline);

    void (async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        setOfflineCapable(Boolean(registration?.active));
      } catch {
        setOfflineCapable(false);
      }
    })();

    return () => {
      window.removeEventListener("online", syncOffline);
      window.removeEventListener("offline", syncOffline);
    };
  }, []);

  return (
    <div
      className={clsx("html-md-converter-tool__local-first tool-workspace-panel", className)}
      role="status"
      aria-live="polite"
    >
      <div className="html-md-converter-tool__local-first-main">
        <Lock className="html-md-converter-tool__local-first-icon" aria-hidden />
        <span className="html-md-converter-tool__local-first-text">{labels.localFirstBadge}</span>
        {offlineCapable ? (
          <span className="html-md-converter-tool__offline-tag">
            {isOffline ? (
              <>
                <WifiOff className="html-md-converter-tool__offline-icon" aria-hidden />
                {labels.offlineReady}
              </>
            ) : (
              labels.offlineReady
            )}
          </span>
        ) : null}
      </div>
      <button type="button" className="html-md-converter-tool__clear-btn" onClick={onClearAll}>
        {labels.clearAllButton}
      </button>
    </div>
  );
}
