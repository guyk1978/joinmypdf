(function () {
  "use strict";

  function addStyles() {
    if (document.getElementById("share-float-styles")) return;
    const style = document.createElement("style");
    style.id = "share-float-styles";
    style.textContent = `
      .share-float {
        position: fixed;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 40;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .share-float__stack {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }
      .share-float__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.86);
        color: #e5e7eb;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(2, 6, 23, 0.28);
        transition: transform .16s ease, background .16s ease, border-color .16s ease;
      }
      .share-float__btn:hover {
        transform: translateX(-3px);
        background: rgba(30, 41, 59, 0.95);
        border-color: rgba(56, 189, 248, 0.55);
      }
      .share-float__toggle { display: none; }
      @media (max-width: 900px) {
        .share-float {
          right: 10px;
          bottom: 14px;
          top: auto;
          transform: none;
          align-items: flex-end;
        }
        .share-float__stack {
          align-items: flex-end;
        }
        .share-float__toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(15, 23, 42, 0.92);
          color: #e5e7eb;
          cursor: pointer;
        }
        .share-float[data-open="false"] .share-float__stack { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function encodedUrl() {
    return encodeURIComponent(window.location.href);
  }

  function encodedTitle() {
    return encodeURIComponent(document.title || "JoinMyPDF");
  }

  function shareLinks() {
    return [
      { label: "f", name: "Facebook", url: "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl() },
      { label: "x", name: "X", url: "https://twitter.com/intent/tweet?url=" + encodedUrl() + "&text=" + encodedTitle() },
      { label: "in", name: "LinkedIn", url: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl() },
      { label: "wa", name: "WhatsApp", url: "https://wa.me/?text=" + encodedTitle() + "%20" + encodedUrl() },
    ];
  }

  function openPopup(url) {
    window.open(url, "_blank", "noopener,noreferrer,width=700,height=620");
  }

  function createButton(text, title, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "share-float__btn";
    btn.textContent = text;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.addEventListener("click", onClick);
    return btn;
  }

  function mountShareFloat() {
    if (document.getElementById("share-float")) return;
    addStyles();

    const root = document.createElement("aside");
    root.id = "share-float";
    root.className = "share-float";
    root.dataset.open = "false";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "share-float__toggle";
    toggle.textContent = "↗";
    toggle.setAttribute("aria-label", "Open share actions");
    toggle.addEventListener("click", function () {
      root.dataset.open = root.dataset.open === "true" ? "false" : "true";
    });

    const stack = document.createElement("div");
    stack.className = "share-float__stack";
    shareLinks().forEach((item) => {
      stack.appendChild(createButton(item.label, "Share on " + item.name, function () {
        openPopup(item.url);
      }));
    });
    stack.appendChild(
      createButton("⧉", "Copy link", async function () {
        try {
          await navigator.clipboard.writeText(window.location.href);
          this.textContent = "✓";
          const self = this;
          setTimeout(function () {
            self.textContent = "⧉";
          }, 1200);
        } catch {
          openPopup(window.location.href);
        }
      })
    );

    root.appendChild(toggle);
    root.appendChild(stack);
    document.body.appendChild(root);
  }

  document.addEventListener("DOMContentLoaded", mountShareFloat);
})();
