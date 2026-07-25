"use client";

import { Check, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPwaButton() {
  const t = useTranslations("Header");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const syncInstalled = () => {
      const standalone = isStandaloneDisplay();
      setInstalled(standalone);
      if (standalone) setDeferredPrompt(null);
    };

    syncInstalled();

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (isStandaloneDisplay()) return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstalled(false);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };

    const mediaStandalone = window.matchMedia("(display-mode: standalone)");
    const mediaOverlay = window.matchMedia("(display-mode: window-controls-overlay)");
    mediaStandalone.addEventListener("change", syncInstalled);
    mediaOverlay.addEventListener("change", syncInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      mediaStandalone.removeEventListener("change", syncInstalled);
      mediaOverlay.removeEventListener("change", syncInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt || installed) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setInstalled(true);
    }
  }, [deferredPrompt, installed]);

  if (installed) {
    const label = t("appAlreadyInstalled");
    return (
      <button
        type="button"
        className="site-header__install-button site-header__install-button--installed"
        aria-label={label}
        title={label}
        disabled
      >
        <Check className="site-header__install-icon" aria-hidden="true" strokeWidth={2.25} />
      </button>
    );
  }

  if (!deferredPrompt) return null;

  const label = t("installApp");
  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      className="site-header__install-button"
      aria-label={label}
      title={label}
    >
      <Download className="site-header__install-icon" aria-hidden="true" />
    </button>
  );
}
