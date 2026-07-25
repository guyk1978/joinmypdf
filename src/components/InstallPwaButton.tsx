"use client";

import { Check, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  getDeferredPwaInstallPrompt,
  isStandaloneDisplay,
  promptPwaInstall,
  resolvePwaInstalled,
  subscribePwaInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

export function InstallPwaButton() {
  const t = useTranslations("Header");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isStandaloneDisplay();
  });

  useEffect(() => {
    let cancelled = false;

    void resolvePwaInstalled().then((next) => {
      if (!cancelled) setInstalled(next);
    });

    const unsub = subscribePwaInstallPrompt((prompt) => {
      if (cancelled) return;
      setDeferredPrompt(prompt);
      if (prompt) setInstalled(false);
    });

    const onInstalled = () => {
      if (!cancelled) {
        setInstalled(true);
        setDeferredPrompt(null);
      }
    };
    window.addEventListener("joinmypdf:pwa-installed", onInstalled);

    // Seed from any prompt already captured before mount.
    setDeferredPrompt(getDeferredPwaInstallPrompt());

    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener("joinmypdf:pwa-installed", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (installed) return;
    const outcome = await promptPwaInstall();
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }, [installed]);

  // Hide the permanently-disabled Download square when the browser never
  // exposes beforeinstallprompt (Safari, Firefox, private windows, etc.).
  if (!installed && !deferredPrompt) {
    return null;
  }

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
