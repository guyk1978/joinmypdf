/* global PDFCore, UICore */
(function () {
  "use strict";

  var THUMB_SCALE = 0.35;

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

  function initDeletePagesWorkspace() {
    if (document.body.getAttribute("data-tool-operation") !== "delete-pages") return;

    var dropzone = byId("dropzone");
    var input = byId("toolInput");
    var workspace = byId("deletePagesWorkspace");
    var grid = byId("deletePagesGrid");
    var statusEl = byId("statusText");
    var primaryBtn = byId("primaryAction");
    var clearSelBtn = byId("deleteClearSelection");
    var clearFileBtn = byId("clearAction");

    if (!dropzone || !input || !workspace || !grid) return;

    var state = {
      file: null,
      bytes: null,
      pageCount: 0,
      marked: {},
      busy: false,
    };

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function markedList() {
      return Object.keys(state.marked)
        .filter(function (k) {
          return state.marked[k];
        })
        .map(Number);
    }

    function updateButtons() {
      var count = markedList().length;
      if (primaryBtn) primaryBtn.disabled = state.busy || !count || count >= state.pageCount;
      if (clearSelBtn) clearSelBtn.disabled = state.busy || !count;
    }

    function resetAll() {
      state.file = null;
      state.bytes = null;
      state.pageCount = 0;
      state.marked = {};
      if (input) input.value = "";
      workspace.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      grid.innerHTML = "";
      updateButtons();
      setStatus("");
    }

    function renderThumb(pageIndex) {
      var card = document.createElement("div");
      card.className = "delete-page-thumb";
      card.dataset.pageIndex = String(pageIndex);
      card.setAttribute("role", "listitem");
      card.innerHTML =
        '<div class="delete-page-thumb__canvas-wrap"><p class="delete-page-thumb__loading">Loading…</p></div>' +
        '<div class="delete-page-thumb__footer">' +
        '<span class="delete-page-thumb__label">Page ' +
        (pageIndex + 1) +
        "</span>" +
        '<button type="button" class="delete-page-thumb__remove" aria-label="Mark page ' +
        (pageIndex + 1) +
        ' for deletion">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm3 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor"/></svg>' +
        "</button></div>";

      var wrap = card.querySelector(".delete-page-thumb__canvas-wrap");
      var btn = card.querySelector(".delete-page-thumb__remove");

      function applyMarked() {
        var on = !!state.marked[pageIndex];
        card.classList.toggle("is-marked", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.innerHTML = on
          ? '<span class="delete-page-thumb__remove-text">Undo</span>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm3 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor"/></svg>';
        var strike = wrap.querySelector(".delete-page-thumb__strike");
        if (on && !strike) {
          strike = document.createElement("div");
          strike.className = "delete-page-thumb__strike";
          strike.setAttribute("aria-hidden", "true");
          wrap.appendChild(strike);
        } else if (!on && strike) {
          strike.remove();
        }
      }

      btn.addEventListener("click", function () {
        if (state.busy) return;
        if (state.marked[pageIndex]) delete state.marked[pageIndex];
        else state.marked[pageIndex] = true;
        applyMarked();
        updateButtons();
        var n = markedList().length;
        setStatus(n ? n + " page(s) marked for deletion." : "Selection cleared.");
      });

      PDFCore.renderPdfPageThumbnail(state.bytes, pageIndex, "", THUMB_SCALE).then(function (canvas) {
        wrap.innerHTML = "";
        canvas.className = "delete-page-thumb__canvas";
        wrap.appendChild(canvas);
        if (state.marked[pageIndex]) {
          var strike = document.createElement("div");
          strike.className = "delete-page-thumb__strike";
          strike.setAttribute("aria-hidden", "true");
          wrap.appendChild(strike);
        }
        applyMarked();
      });

      return card;
    }

    function renderGrid() {
      grid.innerHTML = "";
      for (var i = 0; i < state.pageCount; i += 1) {
        grid.appendChild(renderThumb(i));
      }
    }

    function loadFile(file) {
      if (!file) return;
      state.file = file;
      state.marked = {};
      return file.arrayBuffer().then(function (buf) {
        state.bytes = new Uint8Array(buf);
        return PDFCore.loadPdfPageCountForDelete(state.bytes).then(function (count) {
          state.pageCount = count;
          dropzone.classList.add("is-hidden");
          workspace.classList.remove("is-hidden");
          setStatus("Loaded " + count + " page(s). Click the trash icon on pages to remove.");
          renderGrid();
          updateButtons();
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

    if (clearSelBtn) {
      clearSelBtn.addEventListener("click", function () {
        state.marked = {};
        grid.querySelectorAll(".delete-page-thumb").forEach(function (card) {
          card.classList.remove("is-marked");
          var idx = Number(card.dataset.pageIndex);
          var btn = card.querySelector(".delete-page-thumb__remove");
          var strike = card.querySelector(".delete-page-thumb__strike");
          if (strike) strike.remove();
          if (btn) {
            btn.setAttribute("aria-pressed", "false");
            btn.innerHTML =
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm3 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor"/></svg>';
          }
        });
        updateButtons();
        setStatus("Selection cleared.");
      });
    }

    if (clearFileBtn) clearFileBtn.addEventListener("click", resetAll);

    if (primaryBtn) {
      primaryBtn.addEventListener("click", function () {
        var indices = markedList();
        if (state.busy || !state.file || !indices.length) return;
        state.busy = true;
        primaryBtn.classList.add("is-busy");
        primaryBtn.disabled = true;
        setStatus("Removing selected pages…");
        PDFCore.deletePdfPagesFile(state.file, indices)
          .then(function (bytes) {
            var base = state.file.name.replace(/\.pdf$/i, "") || "document";
            downloadBlob(new Blob([bytes], { type: "application/pdf" }), base + "-pages-removed.pdf");
            setStatus("Downloaded " + (state.pageCount - indices.length) + " remaining page(s).");
          })
          .catch(function (err) {
            setStatus(err && err.message ? err.message : "Delete failed.");
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
    document.addEventListener("DOMContentLoaded", initDeletePagesWorkspace);
  } else {
    initDeletePagesWorkspace();
  }
})();
