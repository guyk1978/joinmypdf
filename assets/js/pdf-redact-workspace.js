/* global PDFCore, UICore */
(function () {
  "use strict";

  var UI_SCALE = 1.25;

  function byId(id) {
    return document.getElementById(id);
  }

  function downloadBlob(blob, name) {
    if (window.UICore && typeof UICore.downloadBlob === "function") {
      UICore.downloadBlob(blob, name);
      return;
    }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1200);
  }

  function initRedactWorkspace() {
    if (document.body.getAttribute("data-tool-operation") !== "redact") return;

    var dropzone = byId("dropzone");
    var input = byId("toolInput");
    var workspace = byId("redactWorkspace");
    var pagesRoot = byId("redactPages");
    var statusEl = byId("statusText");
    var primaryBtn = byId("primaryAction");
    var clearAllBtn = byId("redactClearAll");
    var clearFileBtn = byId("clearAction");
    var passwordInput = byId("redactPassword");
    var passwordPanel = byId("redactPasswordPanel");
    var loadPagesBtn = byId("redactLoadPages");

    if (!dropzone || !input || !workspace || !pagesRoot) return;

    var state = {
      file: null,
      bytes: null,
      pageCount: 0,
      encrypted: false,
      password: "",
      boxes: [],
      draft: null,
      busy: false,
    };

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function updateButtons() {
      if (primaryBtn) primaryBtn.disabled = state.busy || !state.boxes.length;
      if (clearAllBtn) clearAllBtn.disabled = state.busy || !state.boxes.length;
    }

    function resetAll() {
      state.file = null;
      state.bytes = null;
      state.pageCount = 0;
      state.encrypted = false;
      state.password = "";
      state.boxes = [];
      state.draft = null;
      if (input) input.value = "";
      if (passwordInput) passwordInput.value = "";
      if (passwordPanel) passwordPanel.classList.add("is-hidden");
      workspace.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      pagesRoot.innerHTML = "";
      updateButtons();
      setStatus("");
    }

    function renderBoxesOverlay(overlay, pageIndex) {
      overlay.innerHTML = "";
      state.boxes
        .filter(function (b) {
          return b.pageIndex === pageIndex;
        })
        .forEach(function (box) {
          var el = document.createElement("span");
          el.className = "redact-box";
          el.style.left = box.nx * 100 + "%";
          el.style.top = box.ny * 100 + "%";
          el.style.width = box.nw * 100 + "%";
          el.style.height = box.nh * 100 + "%";
          overlay.appendChild(el);
        });

      if (state.draft && state.draft.pageIndex === pageIndex) {
        var stage = overlay.parentElement;
        var w = stage.clientWidth || 1;
        var h = stage.clientHeight || 1;
        var d = state.draft;
        var draft = document.createElement("span");
        draft.className = "redact-box redact-box--draft";
        draft.style.left = (Math.min(d.startX, d.currentX) / w) * 100 + "%";
        draft.style.top = (Math.min(d.startY, d.currentY) / h) * 100 + "%";
        draft.style.width = (Math.abs(d.currentX - d.startX) / w) * 100 + "%";
        draft.style.height = (Math.abs(d.currentY - d.startY) / h) * 100 + "%";
        overlay.appendChild(draft);
      }
    }

    function attachPageInteractions(stage, overlay, pageIndex) {
      stage.addEventListener("mousedown", function (e) {
        if (e.button !== 0 || state.busy) return;
        var rect = stage.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        state.draft = { pageIndex: pageIndex, startX: x, startY: y, currentX: x, currentY: y };
      });

      stage.addEventListener("mousemove", function (e) {
        if (!state.draft || state.draft.pageIndex !== pageIndex) return;
        var rect = stage.getBoundingClientRect();
        state.draft.currentX = e.clientX - rect.left;
        state.draft.currentY = e.clientY - rect.top;
        renderBoxesOverlay(overlay, pageIndex);
      });

      function finish() {
        if (!state.draft || state.draft.pageIndex !== pageIndex) return;
        var el = stage;
        var w = el.clientWidth;
        var h = el.clientHeight;
        var d = state.draft;
        var left = Math.min(d.startX, d.currentX);
        var top = Math.min(d.startY, d.currentY);
        var width = Math.abs(d.currentX - d.startX);
        var height = Math.abs(d.currentY - d.startY);
        state.draft = null;
        if (width >= 6 && height >= 6 && w && h) {
          state.boxes.push({
            pageIndex: pageIndex,
            nx: left / w,
            ny: top / h,
            nw: width / w,
            nh: height / h,
          });
          updateButtons();
          setStatus(state.boxes.length + " redaction box(es) marked.");
        }
        renderBoxesOverlay(overlay, pageIndex);
      }

      stage.addEventListener("mouseup", finish);
      stage.addEventListener("mouseleave", finish);
    }

    function renderPages() {
      pagesRoot.innerHTML = "";
      if (!state.bytes || !state.pageCount) return;

      var chain = Promise.resolve();
      for (var i = 0; i < state.pageCount; i += 1) {
        (function (pageIndex) {
          chain = chain.then(function () {
            return PDFCore.renderPdfPageForUi(state.bytes, pageIndex, state.password, UI_SCALE).then(function (
              canvas,
            ) {
              var page = document.createElement("div");
              page.className = "redact-page";
              page.dataset.pageIndex = String(pageIndex);
              page.innerHTML =
                '<p class="redact-page__label">Page ' +
                (pageIndex + 1) +
                '</p><div class="redact-page__stage"><p class="redact-page__loading">Rendering page…</p></div><p class="redact-page__hint">Click and drag to mark areas to black out.</p>';
              var stage = page.querySelector(".redact-page__stage");
              stage.innerHTML = "";
              canvas.className = "redact-page__canvas";
              stage.appendChild(canvas);
              var overlay = document.createElement("div");
              overlay.className = "redact-page__overlay";
              stage.appendChild(overlay);
              attachPageInteractions(stage, overlay, pageIndex);
              renderBoxesOverlay(overlay, pageIndex);
              pagesRoot.appendChild(page);
            });
          });
        })(i);
      }
    }

    function loadFile(file) {
      if (!file) return;
      state.file = file;
      state.boxes = [];
      state.draft = null;
      return file.arrayBuffer().then(function (buf) {
        state.bytes = new Uint8Array(buf);
        return PDFCore.isPdfEncrypted(file).then(function (enc) {
          state.encrypted = enc;
          if (passwordPanel) passwordPanel.classList.toggle("is-hidden", !enc);
          if (enc) {
            state.pageCount = 0;
            pagesRoot.innerHTML = "";
            setStatus("Enter the PDF password, then click Load pages.");
            return;
          }
          return PDFCore.loadPdfPageCount(state.bytes, "").then(function (count) {
            state.pageCount = count;
            dropzone.classList.add("is-hidden");
            workspace.classList.remove("is-hidden");
            setStatus("Loaded " + count + " page(s). Drag rectangles over sensitive content.");
            renderPages();
            updateButtons();
          });
        });
      });
    }

    dropzone.addEventListener("click", function () {
      input.click();
    });
    dropzone.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    dropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) loadFile(input.files[0]);
      input.value = "";
    });

    if (loadPagesBtn) {
      loadPagesBtn.addEventListener("click", function () {
        state.password = passwordInput ? passwordInput.value : "";
        if (!state.bytes) return;
        PDFCore.loadPdfPageCount(state.bytes, state.password)
          .then(function (count) {
            state.pageCount = count;
            dropzone.classList.add("is-hidden");
            workspace.classList.remove("is-hidden");
            setStatus("Loaded " + count + " page(s). Mark areas to redact.");
            renderPages();
            updateButtons();
          })
          .catch(function () {
            setStatus("Could not open with that password. Check and try again.");
          });
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", function () {
        state.boxes = [];
        state.draft = null;
        pagesRoot.querySelectorAll(".redact-page").forEach(function (pageEl) {
          var idx = Number(pageEl.dataset.pageIndex || 0);
          var overlay = pageEl.querySelector(".redact-page__overlay");
          if (overlay) renderBoxesOverlay(overlay, idx);
        });
        updateButtons();
        setStatus("All redaction boxes cleared.");
      });
    }

    if (clearFileBtn) {
      clearFileBtn.addEventListener("click", resetAll);
    }

    if (primaryBtn) {
      primaryBtn.addEventListener("click", function () {
        if (state.busy || !state.file || !state.boxes.length) return;
        if (state.encrypted && !state.password && passwordInput) {
          state.password = passwordInput.value;
        }
        if (state.encrypted && !state.password) {
          setStatus("Enter the PDF password to redact this file.");
          return;
        }
        state.busy = true;
        primaryBtn.classList.add("is-busy");
        primaryBtn.disabled = true;
        setStatus("Applying redactions…");
        PDFCore.redactPdfFile(state.file, state.boxes, state.password)
          .then(function (bytes) {
            var base = state.file.name.replace(/\.pdf$/i, "") || "document";
            downloadBlob(new Blob([bytes], { type: "application/pdf" }), base + "-redacted.pdf");
            setStatus("Redacted PDF downloaded.");
          })
          .catch(function (err) {
            setStatus(err && err.message ? err.message : "Redaction failed.");
          })
          .finally(function () {
            state.busy = false;
            primaryBtn.classList.remove("is-busy");
            updateButtons();
          });
      });
    }

    updateButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRedactWorkspace);
  } else {
    initRedactWorkspace();
  }
})();
