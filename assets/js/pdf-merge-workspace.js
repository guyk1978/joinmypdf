/* global PDFCore, VisualReorder, UICore */
(function () {
  "use strict";

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

  function initMergeWorkspace() {
    var grid = byId("mergeReorderGrid");
    if (!grid || !window.PDFCore || !window.VisualReorder) return;

    var dropzone = byId("dropzone");
    var input = byId("toolInput");
    var workspace = byId("mergeWorkspace");
    var statusEl = byId("statusText");
    var primaryBtn = byId("primaryAction");
    var clearBtn = byId("clearAction");
    var fileList = byId("fileList");
    var previewGrid = byId("previewGrid");

    if (!dropzone || !input || !workspace) return;

    if (fileList) fileList.classList.add("is-hidden");
    if (previewGrid) previewGrid.classList.add("is-hidden");

    var state = { files: [], busy: false };

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function updateButtons() {
      if (primaryBtn) primaryBtn.disabled = state.busy || state.files.length < 2;
    }

    function acceptPdf(file) {
      return /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
    }

    function renderCard(file, displayIndex) {
      var card = document.createElement("article");
      card.className = "visual-reorder-card";
      card.setAttribute("role", "listitem");
      card.dataset.displayIndex = String(displayIndex);

      var sizeText =
        PDFCore && typeof PDFCore.formatBytes === "function"
          ? PDFCore.formatBytes(file.size)
          : file.size + " B";

      card.innerHTML =
        '<button type="button" class="visual-reorder-card__remove" aria-label="Remove file">×</button>' +
        '<span class="visual-reorder-card__index">#' +
        (displayIndex + 1) +
        "</span>" +
        '<div class="visual-reorder-card__thumb"><p class="visual-reorder-card__loading">Loading…</p></div>' +
        '<p class="visual-reorder-card__name"></p>' +
        '<p class="visual-reorder-card__meta"></p>';

      card.querySelector(".visual-reorder-card__name").textContent = file.name;
      card.querySelector(".visual-reorder-card__name").title = file.name;
      card.querySelector(".visual-reorder-card__meta").textContent = sizeText;

      var thumb = card.querySelector(".visual-reorder-card__thumb");
      PDFCore.renderFirstPagePreview(file, 0.28)
        .then(function (canvas) {
          canvas.className = "visual-reorder-card__canvas";
          thumb.innerHTML = "";
          thumb.appendChild(canvas);
        })
        .catch(function () {
          thumb.innerHTML = '<div class="visual-reorder-card__pdf-icon" aria-hidden="true">PDF</div>';
        });

      card.querySelector(".visual-reorder-card__remove").addEventListener("click", function () {
        state.files.splice(displayIndex, 1);
        renderGrid();
        updateButtons();
        setStatus(state.files.length ? "Drag cards to set merge order." : "");
      });

      VisualReorder.attachDragReorder(card, {
        getIndex: function () {
          return Number(card.dataset.displayIndex);
        },
        onReorder: function (from, to) {
          state.files = VisualReorder.moveInArray(state.files, from, to);
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
      if (!state.files.length) {
        workspace.classList.add("is-hidden");
        return;
      }
      workspace.classList.remove("is-hidden");
      state.files.forEach(function (file, idx) {
        grid.appendChild(renderCard(file, idx));
      });
    }

    function addFiles(raw) {
      var incoming = Array.from(raw || []).filter(acceptPdf);
      if (!incoming.length) {
        setStatus("No supported PDF files detected.");
        return;
      }
      state.files.push.apply(state.files, incoming);
      renderGrid();
      updateButtons();
      setStatus(incoming.length + " file(s) added. Drag cards to reorder before merging.");
    }

    function resetAll() {
      state.files = [];
      state.busy = false;
      if (input) input.value = "";
      renderGrid();
      updateButtons();
      setStatus("");
    }

    dropzone.addEventListener("click", function () {
      input.click();
    });
    dropzone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropzone.classList.add("drag-over");
    });
    dropzone.addEventListener("dragleave", function () {
      dropzone.classList.remove("drag-over");
    });
    dropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropzone.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });
    input.addEventListener("change", function () {
      if (input.files && input.files.length) addFiles(input.files);
      input.value = "";
    });
    input.multiple = true;

    if (clearBtn) clearBtn.addEventListener("click", resetAll);

    if (primaryBtn) {
      primaryBtn.textContent = "Merge PDFs";
      primaryBtn.addEventListener("click", function () {
        if (state.busy || state.files.length < 2) return;
        state.busy = true;
        primaryBtn.disabled = true;
        setStatus("Merging PDFs…");
        PDFCore.mergePdfFiles(state.files)
          .then(function (bytes) {
            downloadBlob(new Blob([bytes], { type: "application/pdf" }), "joinmypdf-merged.pdf");
            setStatus("Merged " + state.files.length + " file(s) in your chosen order.");
          })
          .catch(function (err) {
            setStatus(err && err.message ? err.message : "Merge failed.");
          })
          .finally(function () {
            state.busy = false;
            updateButtons();
          });
      });
    }

    updateButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMergeWorkspace);
  } else {
    initMergeWorkspace();
  }
})();
