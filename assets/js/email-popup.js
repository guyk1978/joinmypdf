(function () {
  "use strict";

  if (window.__joinmypdfEmailPopupInitialized) return;
  window.__joinmypdfEmailPopupInitialized = true;

  const STORAGE_SEEN_KEY = "hasSeenSubscriptionModal";
  const STORAGE_SUBSCRIBED_KEY = "joinmypdf-popup-subscribed";
  const STORAGE_PENDING_KEY = "joinmypdf-popup-pending-emails";
  const TOOL_COMPLETE_EVENT = "joinmypdf:tool-complete";
  const SUBSCRIBE_ENDPOINT = "/api/subscribe";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const styles = ""
    /* —— Industrial Matte — glass modal —— */
    + "#jmp-popup-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;"
    + "background:rgba(10,10,10,0.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);"
    + "z-index:9999;padding:1rem;opacity:0;transition:opacity .2s ease;}"
    + "#jmp-popup-overlay[data-open=\"true\"]{display:flex;opacity:1;}"
    + "#jmp-popup{width:min(420px,100%);color:#171717;"
    + "background:rgba(255,255,255,0.92);border:1px solid rgba(0,0,0,0.08);border-radius:0;"
    + "backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);"
    + "box-shadow:0 24px 48px -12px rgba(0,0,0,0.18);"
    + "padding:1.5rem;position:relative;font-family:Inter,\"Segoe UI\",Roboto,Arial,sans-serif;"
    + "transform:translateY(6px);opacity:0;transition:transform .2s ease,opacity .2s ease;}"
    + "#jmp-popup-overlay[data-open=\"true\"] #jmp-popup{transform:translateY(0);opacity:1;}"
    + "#jmp-popup__close{position:absolute;top:.75rem;right:.75rem;width:32px;height:32px;border:0;"
    + "background:transparent;color:#737373;font-size:1.25rem;line-height:1;cursor:pointer;border-radius:0;"
    + "display:flex;align-items:center;justify-content:center;"
    + "transition:color .15s ease,background .15s ease;}"
    + "#jmp-popup__close:hover{background:rgba(0,0,0,0.05);color:#404040;}"
    + "#jmp-popup h2{margin:0 2rem .5rem 0;font-size:1.25rem;font-weight:700;letter-spacing:-0.02em;color:#171717;}"
    + "#jmp-popup p.jmp-popup__sub{margin:0 0 1rem;color:#525252;font-size:.875rem;line-height:1.5;}"
    + "#jmp-popup__form{display:grid;gap:.5rem;}"
    + "#jmp-popup__email{width:100%;padding:.625rem .75rem;border-radius:0;box-sizing:border-box;"
    + "background:rgba(250,250,250,0.9);color:#171717;border:1px solid rgba(0,0,0,0.1);"
    + "font-size:.875rem;font-family:inherit;outline:none;"
    + "transition:border-color .15s ease,background .15s ease;}"
    + "#jmp-popup__email::placeholder{color:#a3a3a3;}"
    + "#jmp-popup__email:focus{border-color:#737373;background:#fafafa;box-shadow:none;}"
    + "#jmp-popup__email[aria-invalid=\"true\"]{border-color:#ef4444;}"
    + "#jmp-popup__buttons{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.15rem;}"
    + ".jmp-btn{border:1px solid transparent;border-radius:0;padding:.625rem .75rem;"
    + "font-size:.875rem;cursor:pointer;font-family:inherit;font-weight:600;line-height:1.2;"
    + "transition:background .15s ease,color .15s ease,border-color .15s ease;}"
    + ".jmp-btn:disabled{opacity:.55;cursor:not-allowed;}"
    + ".jmp-btn--primary{background:#047857;color:#ffffff;border-color:#047857;box-shadow:none;}"
    + ".jmp-btn--primary:hover:not(:disabled){background:#065f46;border-color:#065f46;}"
    + ".jmp-btn--ghost{background:#e5e5e5;border-color:transparent;color:#404040;font-weight:500;}"
    + ".jmp-btn--ghost:hover:not(:disabled){background:#d4d4d4;color:#171717;}"
    + ".jmp-btn--bookmark{margin-top:.5rem;width:100%;background:transparent;border:1px solid rgba(0,0,0,0.12);"
    + "color:#404040;font-weight:600;box-shadow:none;}"
    + ".jmp-btn--bookmark:hover:not(:disabled){background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.2);}"
    + "#jmp-popup__hint{margin:.625rem 0 0;font-size:.75rem;color:#737373;text-align:center;}"
    + "#jmp-popup__error{margin:.35rem 0 0;font-size:.8125rem;color:#dc2626;min-height:1rem;}"
    + "#jmp-popup__success{display:none;text-align:center;padding:.25rem 0;}"
    + "#jmp-popup__success h3{margin:.25rem 0 .35rem;font-size:1.125rem;font-weight:700;color:#171717;}"
    + "#jmp-popup__success p{margin:0;color:#525252;font-size:.875rem;line-height:1.5;}"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__form,"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__hint,"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__error{display:none;}"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__success{display:block;}"
    /* —— Dark mode —— */
    + "html.dark #jmp-popup-overlay{background:rgba(0,0,0,0.55);}"
    + "html.dark #jmp-popup{background:rgba(23,23,23,0.8);color:#e5e5e5;border-color:rgba(255,255,255,0.1);"
    + "box-shadow:0 24px 48px -12px rgba(0,0,0,0.45);}"
    + "html.dark #jmp-popup h2{color:#e5e5e5;}"
    + "html.dark #jmp-popup p.jmp-popup__sub,html.dark #jmp-popup__hint,html.dark #jmp-popup__success p{color:#a3a3a3;}"
    + "html.dark #jmp-popup__success h3{color:#f5f5f5;}"
    + "html.dark #jmp-popup__close{color:#737373;}"
    + "html.dark #jmp-popup__close:hover{background:rgba(255,255,255,0.06);color:#d4d4d4;}"
    + "html.dark #jmp-popup__email{background:rgba(10,10,10,0.5);color:#e5e5e5;border-color:rgba(255,255,255,0.1);}"
    + "html.dark #jmp-popup__email::placeholder{color:#737373;}"
    + "html.dark #jmp-popup__email:focus{border-color:#737373;background:rgba(10,10,10,0.65);box-shadow:none;}"
    + "html.dark #jmp-popup__error{color:#fca5a5;}"
    + "html.dark .jmp-btn--primary{background:#059669;color:#ffffff;border-color:#059669;}"
    + "html.dark .jmp-btn--primary:hover:not(:disabled){background:#047857;border-color:#047857;}"
    + "html.dark .jmp-btn--ghost{background:#262626;border-color:transparent;color:#d4d4d4;}"
    + "html.dark .jmp-btn--ghost:hover:not(:disabled){background:#404040;color:#f5f5f5;}"
    + "html.dark .jmp-btn--bookmark{background:transparent;border:1px solid rgba(255,255,255,0.12);color:#d4d4d4;}"
    + "html.dark .jmp-btn--bookmark:hover:not(:disabled){background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.18);}"
    + "@media (max-width:480px){"
    + "#jmp-popup{padding:1.25rem;}"
    + "#jmp-popup__buttons{grid-template-columns:1fr;}"
    + "#jmp-popup h2{font-size:1.125rem;}"
    + "}"
    + "@media (prefers-reduced-motion:reduce){"
    + "#jmp-popup-overlay,#jmp-popup{transition:none;}"
    + "}";

  function track(eventName, payload) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload || {});
      }
    } catch (_) {}
    try {
      if (typeof window.plausible === "function") {
        window.plausible(eventName, payload ? { props: payload } : undefined);
      }
    } catch (_) {}
  }

  function hasSeenSubscriptionModal() {
    try {
      return window.localStorage.getItem(STORAGE_SEEN_KEY) === "true";
    } catch (_) {
      return false;
    }
  }

  function markSubscriptionModalSeen() {
    try {
      window.localStorage.setItem(STORAGE_SEEN_KEY, "true");
    } catch (_) {}
  }

  function alreadySubscribed() {
    try {
      return window.localStorage.getItem(STORAGE_SUBSCRIBED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function shouldSuppressPopup() {
    return hasSeenSubscriptionModal() || alreadySubscribed();
  }

  function markSubscribed() {
    try {
      window.localStorage.setItem(STORAGE_SUBSCRIBED_KEY, "1");
    } catch (_) {}
  }

  function queuePending(email) {
    try {
      const raw = window.localStorage.getItem(STORAGE_PENDING_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(list) ? list : [];
      arr.push({ email: email, at: new Date().toISOString(), page: location.pathname });
      window.localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(arr.slice(-50)));
    } catch (_) {}
  }

  function injectStyles() {
    if (document.getElementById("jmp-popup-styles")) return;
    const style = document.createElement("style");
    style.id = "jmp-popup-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function buildPopup() {
    const overlay = document.createElement("div");
    overlay.id = "jmp-popup-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "jmp-popup-title");
    overlay.dataset.open = "false";
    overlay.innerHTML = ""
      + "<div id=\"jmp-popup\" data-state=\"prompt\">"
      + "  <button id=\"jmp-popup__close\" type=\"button\" aria-label=\"Close\">&times;</button>"
      + "  <h2 id=\"jmp-popup-title\">Save time with PDFs \uD83D\uDE80</h2>"
      + "  <p class=\"jmp-popup__sub\">Bookmark JoinMyPDF or get updates about new free PDF tools.</p>"
      + "  <form id=\"jmp-popup__form\" novalidate>"
      + "    <input id=\"jmp-popup__email\" type=\"email\" autocomplete=\"email\" inputmode=\"email\""
      + "           placeholder=\"Enter your email\" aria-label=\"Email address\" required />"
      + "    <p id=\"jmp-popup__error\" role=\"alert\" aria-live=\"polite\"></p>"
      + "    <div id=\"jmp-popup__buttons\">"
      + "      <button type=\"submit\" class=\"jmp-btn jmp-btn--primary\" id=\"jmp-popup__submit\">Get Updates</button>"
      + "      <button type=\"button\" class=\"jmp-btn jmp-btn--ghost\" id=\"jmp-popup__later\">Maybe Later</button>"
      + "    </div>"
      + "    <button type=\"button\" class=\"jmp-btn jmp-btn--bookmark\" id=\"jmp-popup__bookmark\">\u2B50 Bookmark JoinMyPDF</button>"
      + "  </form>"
      + "  <p id=\"jmp-popup__hint\">No spam. Unsubscribe anytime.</p>"
      + "  <div id=\"jmp-popup__success\">"
      + "    <h3>Thanks! You\u2019re on the list \uD83C\uDF89</h3>"
      + "    <p>We\u2019ll let you know when new PDF tools launch.</p>"
      + "  </div>"
      + "</div>";
    document.body.appendChild(overlay);
    return overlay;
  }

  async function submitEmail(email) {
    const payload = {
      email: email,
      page: location.pathname,
      referrer: document.referrer || "",
      at: new Date().toISOString(),
    };
    try {
      const res = await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("status " + res.status);
      return { ok: true, mode: "remote" };
    } catch (err) {
      queuePending(email);
      return { ok: true, mode: "local", error: err && err.message ? err.message : "network" };
    }
  }

  function showBookmarkHint() {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
    const combo = isMac ? "\u2318 + D" : "Ctrl + D";
    try {
      if (window.sidebar && typeof window.sidebar.addPanel === "function") {
        window.sidebar.addPanel(document.title, location.href, "");
        return true;
      }
      if (window.external && typeof window.external.AddFavorite === "function") {
        window.external.AddFavorite(location.href, document.title);
        return true;
      }
    } catch (_) {}
    window.alert("Press " + combo + " to bookmark JoinMyPDF.");
    return false;
  }

  function init() {
    if (shouldSuppressPopup()) return;

    injectStyles();
    let overlay = null;
    let opened = false;

    function ensureBuilt() {
      if (!overlay) overlay = buildPopup();
      return overlay;
    }

    function open(reason) {
      if (opened) return;
      if (shouldSuppressPopup()) return;
      ensureBuilt();
      opened = true;
      requestAnimationFrame(function () {
        overlay.dataset.open = "true";
      });
      track("popup_view", { trigger: reason || "tool_complete", path: location.pathname });
      const input = document.getElementById("jmp-popup__email");
      if (input) {
        setTimeout(function () {
          try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); }
        }, 220);
      }
      bindHandlers();
    }

    function close(reason) {
      if (!overlay || overlay.dataset.open !== "true") return;
      overlay.dataset.open = "false";
      markSubscriptionModalSeen();
      track("popup_close", { reason: reason || "dismiss" });
    }

    function setError(msg) {
      const errEl = document.getElementById("jmp-popup__error");
      const input = document.getElementById("jmp-popup__email");
      if (errEl) errEl.textContent = msg || "";
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    function showSuccess() {
      const popup = document.getElementById("jmp-popup");
      if (popup) popup.dataset.state = "success";
      setTimeout(function () { close("success"); }, 2200);
    }

    function bindHandlers() {
      const closeBtn = document.getElementById("jmp-popup__close");
      const laterBtn = document.getElementById("jmp-popup__later");
      const form = document.getElementById("jmp-popup__form");
      const submitBtn = document.getElementById("jmp-popup__submit");
      const input = document.getElementById("jmp-popup__email");
      const bookmarkBtn = document.getElementById("jmp-popup__bookmark");

      if (closeBtn && !closeBtn.__bound) {
        closeBtn.__bound = true;
        closeBtn.addEventListener("click", function () { close("x_button"); });
      }
      if (laterBtn && !laterBtn.__bound) {
        laterBtn.__bound = true;
        laterBtn.addEventListener("click", function () { close("maybe_later"); });
      }
      if (overlay && !overlay.__bound) {
        overlay.__bound = true;
        overlay.addEventListener("click", function (event) {
          if (event.target === overlay) close("backdrop");
        });
        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape" && overlay.dataset.open === "true") close("escape");
        });
      }
      if (input && !input.__bound) {
        input.__bound = true;
        input.addEventListener("input", function () { setError(""); });
      }
      if (bookmarkBtn && !bookmarkBtn.__bound) {
        bookmarkBtn.__bound = true;
        bookmarkBtn.addEventListener("click", function () {
          track("popup_bookmark_click", {});
          markSubscriptionModalSeen();
          showBookmarkHint();
        });
      }
      if (form && !form.__bound) {
        form.__bound = true;
        form.addEventListener("submit", async function (event) {
          event.preventDefault();
          const value = (input && input.value ? input.value : "").trim();
          if (!EMAIL_RE.test(value)) {
            setError("Please enter a valid email address.");
            if (input) input.focus();
            return;
          }
          setError("");
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving...";
          }
          const result = await submitEmail(value);
          track("popup_submit", { mode: result.mode, path: location.pathname });
          markSubscribed();
          markSubscriptionModalSeen();
          showSuccess();
        });
      }
    }

    window.addEventListener(TOOL_COMPLETE_EVENT, function () {
      open("tool_complete");
    });

    window.JoinMyPDFPopup = {
      open: function () {
        if (!shouldSuppressPopup()) open("manual");
      },
      close: function () {
        close("manual");
      },
      reset: function () {
        try {
          window.localStorage.removeItem(STORAGE_SEEN_KEY);
          window.localStorage.removeItem(STORAGE_SUBSCRIBED_KEY);
        } catch (_) {}
        opened = false;
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
