(function () {
  "use strict";

  if (window.__joinmypdfInstallInitialized) return;
  window.__joinmypdfInstallInitialized = true;

  const STORAGE_KEY = "joinmypdf-install-dismissed-at";
  const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;
  let deferredPrompt = null;
  const DEBUG_PREFIX = "[pwa-install]";

  function createInstallButton() {
    if (document.getElementById("install-app-btn")) return document.getElementById("install-app-btn");
    const btn = document.createElement("button");
    btn.id = "install-app-btn";
    btn.type = "button";
    btn.className = "install-app-btn";
    btn.textContent = "Install App";
    btn.style.display = "none";
    document.body.appendChild(btn);
    return btn;
  }

  function isStandalone() {
    const mm = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = window.navigator.standalone === true;
    return mm || iosStandalone;
  }

  function isIosSafari() {
    const ua = window.navigator.userAgent || "";
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    return isIos && isSafari;
  }

  function recentlyDismissed() {
    const ts = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  }

  function maybeShowButton(button) {
    const standalone = isStandalone();
    const dismissed = recentlyDismissed();
    const ios = isIosSafari();
    const hasPrompt = Boolean(deferredPrompt);
    console.log(
      DEBUG_PREFIX,
      "state:",
      JSON.stringify({
        standalone,
        hasPrompt,
        ios,
        dismissed,
      })
    );
    if (standalone) {
      button.style.display = "none";
      return;
    }
    if (dismissed) {
      button.style.display = "none";
      return;
    }
    if (!hasPrompt && !ios) {
      button.style.display = "none";
      return;
    }
    button.textContent = deferredPrompt ? "⬇ Install App" : "⬇ Add to Home Screen";
    button.style.display = "inline-flex";
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("/sw.js")
        .then(function () {
          console.log(DEBUG_PREFIX, "service worker registered");
        })
        .catch(function (error) {
          console.log(DEBUG_PREFIX, "service worker registration failed:", error && error.message ? error.message : "unknown");
        });
    });
  }

  function initInstallFlow() {
    const button = createInstallButton();
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
      console.log(DEBUG_PREFIX, "beforeinstallprompt captured");
      maybeShowButton(button);
    });

    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      button.style.display = "none";
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      console.log(DEBUG_PREFIX, "app installed, button hidden");
    });

    button.addEventListener("click", async function () {
      if (deferredPrompt) {
        console.log(DEBUG_PREFIX, "install button clicked with prompt");
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log(DEBUG_PREFIX, "userChoice:", result && result.outcome ? result.outcome : "unknown");
        if (result.outcome !== "accepted") {
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        }
        deferredPrompt = null;
        button.style.display = "none";
        return;
      }
      if (isIosSafari()) {
        console.log(DEBUG_PREFIX, "ios fallback shown");
        window.alert("To install JoinMyPDF on iPhone/iPad: tap Share, then tap 'Add to Home Screen'.");
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        button.style.display = "none";
      }
    });

    console.log(
      DEBUG_PREFIX,
      "initial detection:",
      JSON.stringify({
        standalone: isStandalone(),
        iosSafari: isIosSafari(),
        dismissed: recentlyDismissed(),
      })
    );
    maybeShowButton(button);
  }

  document.addEventListener("DOMContentLoaded", function () {
    registerServiceWorker();
    initInstallFlow();
  });
})();
