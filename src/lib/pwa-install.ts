/**
 * Shared beforeinstallprompt capture so InstallPwaButton and
 * HeaderOverflowMenu do not race over the single-use prompt event.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const PWA_INSTALLED_STORAGE_KEY = "joinmypdf-pwa-installed";
export const PWA_INSTALL_PROMPT_EVENT = "joinmypdf:pwa-install-prompt";
export const PWA_INSTALLED_EVENT = "joinmypdf:pwa-installed";

type PromptListener = (prompt: BeforeInstallPromptEvent | null) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenersInstalled = false;
const promptListeners = new Set<PromptListener>();

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function readInstalledFlag(): boolean {
  try {
    return window.localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeInstalledFlag(installed: boolean) {
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

function emitPrompt(next: BeforeInstallPromptEvent | null) {
  deferredPrompt = next;
  for (const listener of promptListeners) listener(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PWA_INSTALL_PROMPT_EVENT, { detail: { prompt: next } }),
    );
  }
}

function markInstalled() {
  writeInstalledFlag(true);
  emitPrompt(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PWA_INSTALLED_EVENT));
  }
}

function ensurePwaInstallListeners() {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (isStandaloneDisplay()) return;
    // Prompt available again ⇒ not currently installed in this profile.
    writeInstalledFlag(false);
    emitPrompt(event as BeforeInstallPromptEvent);
  });

  window.addEventListener("appinstalled", () => {
    markInstalled();
  });

  const mediaStandalone = window.matchMedia("(display-mode: standalone)");
  const mediaOverlay = window.matchMedia("(display-mode: window-controls-overlay)");
  const onDisplayModeChange = () => {
    if (isStandaloneDisplay()) {
      markInstalled();
      return;
    }
    // Left standalone without a sticky flag clear — drop the Check state
    // unless related-apps still report an install.
    void (async () => {
      if (await hasInstalledRelatedWebApp()) {
        markInstalled();
        return;
      }
      writeInstalledFlag(false);
    })();
  };
  mediaStandalone.addEventListener("change", onDisplayModeChange);
  mediaOverlay.addEventListener("change", onDisplayModeChange);
}

/**
 * Subscribe to the shared deferred install prompt. Returns the current prompt
 * (if any) and an unsubscribe function.
 */
export function subscribePwaInstallPrompt(listener: PromptListener): () => void {
  ensurePwaInstallListeners();
  promptListeners.add(listener);
  listener(deferredPrompt);
  return () => {
    promptListeners.delete(listener);
  };
}

export function getDeferredPwaInstallPrompt(): BeforeInstallPromptEvent | null {
  ensurePwaInstallListeners();
  return deferredPrompt;
}

/** True when we should treat the app as installed for UI purposes. */
export async function resolvePwaInstalled(): Promise<boolean> {
  ensurePwaInstallListeners();
  if (isStandaloneDisplay()) {
    writeInstalledFlag(true);
    return true;
  }
  if (await hasInstalledRelatedWebApp()) {
    writeInstalledFlag(true);
    return true;
  }
  // Sticky localStorage alone is not enough — only trust it while standalone
  // or related-apps confirm. Otherwise clear so uninstalls don't leave a Check.
  if (readInstalledFlag() && !isStandaloneDisplay()) {
    writeInstalledFlag(false);
  }
  return false;
}

export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const prompt = getDeferredPwaInstallPrompt();
  if (!prompt) return "unavailable";
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  emitPrompt(null);
  if (outcome === "accepted") markInstalled();
  return outcome;
}
