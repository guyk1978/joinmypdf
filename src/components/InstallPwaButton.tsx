"use client";

import { Check, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PWA_INSTALLED_STORAGE_KEY = "joinmypdf-pwa-installed";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readInstalledFlag(): boolean {
  try {
    return window.localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeInstalledFlag(installed: boolean) {
  try {
    if (installed) window.localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, "1");
    else window.localStorage.removeItem(PWA_INSTALLED_STORAGE_KEY);
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc.).
  }
}

async function hasInstalledRelatedWebApp(): Promise<boolean> {
  const nav = window.navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; url?: string }>>;
  };
  if (typeof nav.getInstalledRelatedApps !== "function") return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.length > 0;
  } catch {
    return false;
  }
}

export function InstallPwaButton() {
  const t = useTranslations("Header");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isStandaloneDisplay() || readInstalledFlag();
  });

  useEffect(() => {
    let cancelled = false;

    const markInstalled = (next: boolean) => {
      if (cancelled) return;
      setInstalled(next);
      writeInstalledFlag(next);
      if (next) setDeferredPrompt(null);
    };

    const syncInstalled = async () => {
      if (isStandaloneDisplay() || readInstalledFlag() || (await hasInstalledRelatedWebApp())) {
        markInstalled(true);
        return;
      }
      if (!cancelled) setInstalled(false);
    };

    void syncInstalled();

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (isStandaloneDisplay()) return;
      // Prompt available again ⇒ treat as not currently installed in this browser profile.
      writeInstalledFlag(false);
      setInstalled(false);
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      markInstalled(true);
    };

    const mediaStandalone = window.matchMedia("(display-mode: standalone)");
    const mediaOverlay = window.matchMedia("(display-mode: window-controls-overlay)");
    const onDisplayModeChange = () => {
      void syncInstalled();
    };

    mediaStandalone.addEventListener("change", onDisplayModeChange);
    mediaOverlay.addEventListener("change", onDisplayModeChange);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      cancelled = true;
      mediaStandalone.removeEventListener("change", onDisplayModeChange);
      mediaOverlay.removeEventListener("change", onDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (installed) return;
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setInstalled(true);
      writeInstalledFlag(true);
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

  const canPrompt = Boolean(deferredPrompt);
  const label = canPrompt ? t("installApp") : t("installAppUnavailable");

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      className="site-header__install-button"
      aria-label={label}
      title={label}
      disabled={!canPrompt}
    >
      <Download className="site-header__install-icon" aria-hidden="true" />
    </button>
  );
}
