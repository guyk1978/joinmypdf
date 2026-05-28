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
    /* —— Light mode (default) —— */
    + "#jmp-popup-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;"
    + "background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);"
    + "z-index:9999;padding:1rem;opacity:0;transition:opacity .25s ease;}"
    + "#jmp-popup-overlay[data-open=\"true\"]{display:flex;opacity:1;}"
    + "#jmp-popup{width:min(440px,100%);background:#ffffff;color:#0f172a;"
    + "border:1px solid #e2e8f0;border-radius:18px;"
    + "box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);"
    + "padding:1.6rem 1.4rem 1.3rem;position:relative;font-family:Inter,\"Segoe UI\",Roboto,Arial,sans-serif;"
    + "transform:translateY(8px) scale(.96);opacity:0;transition:transform .28s ease,opacity .28s ease;}"
    + "#jmp-popup-overlay[data-open=\"true\"] #jmp-popup{transform:translateY(0) scale(1);opacity:1;}"
    + "#jmp-popup__close{position:absolute;top:.55rem;right:.6rem;width:34px;height:34px;border:0;"
    + "background:transparent;color:#94a3b8;font-size:1.4rem;line-height:1;cursor:pointer;border-radius:8px;"
    + "transition:color .15s ease,background .15s ease;}"
    + "#jmp-popup__close:hover{background:rgba(15,23,42,0.06);color:#475569;}"
    + "#jmp-popup h2{margin:0 0 .35rem;font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;color:#020617;}"
    + "#jmp-popup p.jmp-popup__sub{margin:0 0 1rem;color:#475569;font-size:.95rem;line-height:1.5;}"
    + "#jmp-popup__form{display:grid;gap:.55rem;}"
    + "#jmp-popup__email{width:100%;padding:.75rem .9rem;border-radius:10px;box-sizing:border-box;"
    + "background:#f8fafc;color:#0f172a;border:1px solid #e2e8f0;"
    + "font-size:1rem;font-family:inherit;outline:none;"
    + "transition:border-color .15s ease,box-shadow .15s ease;}"
    + "#jmp-popup__email::placeholder{color:#94a3b8;}"
    + "#jmp-popup__email:focus{border-color:#2563eb;box-shadow:0 0 0 2px #2563eb;}"
    + "#jmp-popup__email[aria-invalid=\"true\"]{border-color:#ef4444;box-shadow:0 0 0 2px rgba(239,68,68,0.35);}"
    + "#jmp-popup__buttons{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.2rem;}"
    + ".jmp-btn{border:1px solid transparent;border-radius:10px;padding:.7rem .9rem;"
    + "font-size:.98rem;cursor:pointer;font-family:inherit;line-height:1.1;transition:background .15s ease,"
    + "color .15s ease,border-color .15s ease,box-shadow .15s ease,transform .15s ease;}"
    + ".jmp-btn:disabled{opacity:.55;cursor:not-allowed;}"
    + ".jmp-btn--primary{background:#2563eb;color:#ffffff;font-weight:700;"
    + "box-shadow:0 4px 6px -1px rgba(37,99,235,0.35);}"
    + ".jmp-btn--primary:hover:not(:disabled){background:#1d4ed8;}"
    + ".jmp-btn--ghost{background:#f1f5f9;border-color:transparent;color:#334155;font-weight:500;}"
    + ".jmp-btn--ghost:hover:not(:disabled){background:#e2e8f0;color:#1e293b;}"
    + ".jmp-btn--bookmark{margin-top:.55rem;width:100%;background:#fbbf24;border:1px solid #f59e0b;"
    + "color:#020617;font-weight:700;box-shadow:0 1px 2px rgba(15,23,42,0.08);}"
    + ".jmp-btn--bookmark:hover:not(:disabled){background:#f59e0b;}"
    + "#jmp-popup__hint{margin:.7rem 0 0;font-size:.78rem;color:#475569;text-align:center;}"
    + "#jmp-popup__error{margin:.4rem 0 0;font-size:.85rem;color:#dc2626;min-height:1.05rem;}"
    + "#jmp-popup__success{display:none;text-align:center;padding:.5rem 0 .25rem;}"
    + "#jmp-popup__success h3{margin:.4rem 0 .35rem;font-size:1.2rem;font-weight:700;color:#020617;}"
    + "#jmp-popup__success p{margin:0;color:#475569;font-size:.92rem;line-height:1.5;}"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__form,"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__hint,"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__error{display:none;}"
    + "#jmp-popup[data-state=\"success\"] #jmp-popup__success{display:block;}"
    /* —— Dark mode (html.dark / next-themes) —— */
    + "html.dark #jmp-popup-overlay{background:rgba(2,6,23,0.62);}"
    + "html.dark #jmp-popup{background:#111827;color:#ffffff;border-color:#334155;"
    + "box-shadow:0 25px 50px -12px rgba(0,0,0,0.55);}"
    + "html.dark #jmp-popup h2{color:#ffffff;}"
    + "html.dark #jmp-popup p.jmp-popup__sub,html.dark #jmp-popup__hint,html.dark #jmp-popup__success p{color:#94a3b8;}"
    + "html.dark #jmp-popup__success h3{color:#ffffff;}"
    + "html.dark #jmp-popup__close{color:#64748b;}"
    + "html.dark #jmp-popup__close:hover{background:rgba(148,163,184,0.12);color:#cbd5e1;}"
    + "html.dark #jmp-popup__email{background:#1e293b;color:#ffffff;border-color:#334155;}"
    + "html.dark #jmp-popup__email::placeholder{color:#64748b;}"
    + "html.dark #jmp-popup__email:focus{border-color:#2563eb;box-shadow:0 0 0 2px #2563eb;}"
    + "html.dark #jmp-popup__error{color:#fca5a5;}"
    + "html.dark .jmp-btn--primary{background:#2563eb;color:#ffffff;}"
    + "html.dark .jmp-btn--primary:hover:not(:disabled){background:#1d4ed8;}"
    + "html.dark .jmp-btn--ghost{background:#1e293b;border-color:transparent;color:#cbd5e1;}"
    + "html.dark .jmp-btn--ghost:hover:not(:disabled){background:#334155;color:#e2e8f0;}"
    + "html.dark .jmp-btn--bookmark{background:transparent;border:1px solid rgba(59,130,246,0.5);"
    + "color:#ffffff;box-shadow:none;}"
    + "html.dark .jmp-btn--bookmark:hover:not(:disabled){background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.65);}"
    + "@media (max-width:480px){"
    + "#jmp-popup{padding:1.4rem 1.1rem 1.1rem;border-radius:16px;}"
    + "#jmp-popup__buttons{grid-template-columns:1fr;}"
    + "#jmp-popup h2{font-size:1.35rem;}"
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
        }, 280);
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
