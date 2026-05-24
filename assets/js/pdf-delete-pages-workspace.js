/* global PDFCore, VisualReorder, UICore */
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

    if (!dropzone || !input || !workspace || !grid || !window.VisualReorder) return;

    var state = {
      file: null,
      bytes: null,
      pageCount: 0,
      pageOrder: [],
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
      state.pageOrder = [];
      state.marked = {};
      if (input) input.value = "";
      workspace.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      grid.innerHTML = "";
      updateButtons();
      setStatus("");
    }

    function renderThumb(originalIndex, displayIndex) {
      var card = document.createElement("div");
      card.className = "visual-reorder-card visual-reorder-card--page";
      card.setAttribute("role", "listitem");
      card.dataset.displayIndex = String(displayIndex);
      card.dataset.originalIndex = String(originalIndex);

      card.innerHTML =
        '<span class="visual-reorder-card__index">#' +
        (displayIndex + 1) +
        "</span>" +
        '<div class="delete-page-thumb">' +
        '<div class="delete-page-thumb__canvas-wrap"><p class="delete-page-thumb__loading">Loading…</p></div>' +
        '<div class="delete-page-thumb__footer">' +
        '<span class="delete-page-thumb__label">Page ' +
        (originalIndex + 1) +
        "</span>" +
        '<button type="button" class="delete-page-thumb__remove" aria-label="Mark page ' +
        (originalIndex + 1) +
        ' for deletion">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm3 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor"/></svg>' +
        "</button></div></div>";

      var inner = card.querySelector(".delete-page-thumb");
      var wrap = card.querySelector(".delete-page-thumb__canvas-wrap");
      var btn = card.querySelector(".delete-page-thumb__remove");

      function applyMarked() {
        var on = !!state.marked[originalIndex];
        inner.classList.toggle("is-marked", on);
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
        if (state.marked[originalIndex]) delete state.marked[originalIndex];
        else state.marked[originalIndex] = true;
        applyMarked();
        updateButtons();
        var n = markedList().length;
        setStatus(n ? n + " page(s) marked for deletion." : "Selection cleared.");
      });

      PDFCore.renderPdfPageThumbnail(state.bytes, originalIndex, "", THUMB_SCALE).then(function (canvas) {
        wrap.innerHTML = "";
        canvas.className = "delete-page-thumb__canvas";
        wrap.appendChild(canvas);
        applyMarked();
      });

      VisualReorder.attachDragReorder(card, {
        getIndex: function () {
          return Number(card.dataset.displayIndex);
        },
        onReorder: function (from, to) {
          state.pageOrder = VisualReorder.moveInArray(state.pageOrder, from, to);
          renderGrid();
        },
        onDragState: function (_index, phase) {
          if (phase === "end" || phase === "drop") VisualReorder.clearGridDragState(grid);
        },
      });

      return card;
    }

    function renderGrid() {
      grid.innerHTML = "";
      state.pageOrder.forEach(function (originalIndex, displayIndex) {
        grid.appendChild(renderThumb(originalIndex, displayIndex));
      });
    }

    function loadFile(file) {
      if (!file) return;
      state.file = file;
      state.marked = {};
      return file.arrayBuffer().then(function (buf) {
        state.bytes = new Uint8Array(buf);
        return PDFCore.loadPdfPageCountForDelete(state.bytes).then(function (count) {
          state.pageCount = count;
          state.pageOrder = [];
          for (var i = 0; i < count; i += 1) state.pageOrder.push(i);
          dropzone.classList.add("is-hidden");
          workspace.classList.remove("is-hidden");
          setStatus("Loaded " + count + " page(s). Drag to reorder, then mark pages to remove.");
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
        renderGrid();
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
        setStatus("Applying page order and removing selected pages…");
        PDFCore.deletePdfPagesFile(state.file, indices, state.pageOrder)
          .then(function (bytes) {
            var base = state.file.name.replace(/\.pdf$/i, "") || "document";
            var remaining = state.pageOrder.filter(function (i) {
              return !state.marked[i];
            }).length;
            downloadBlob(new Blob([bytes], { type: "application/pdf" }), base + "-pages-removed.pdf");
            setStatus("Downloaded " + remaining + " remaining page(s).");
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
