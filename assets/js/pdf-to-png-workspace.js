/* global PDFCore, UICore, fflate, pdfjsLib */
(function () {
  "use strict";

  var EXPORT_SCALE = 2.0;

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

  function initPdfToPngWorkspace() {
    if (document.body.getAttribute("data-tool-operation") !== "pdf-to-png") return;

    var dropzone = byId("dropzone");
    var input = byId("toolInput");
    var workspace = byId("pdfToPngWorkspace");
    var pagesRoot = byId("pdfToPngGrid");
    var statusEl = byId("statusText");
    var exportBtn = byId("primaryAction");
    var zipBtn = byId("pdfToPngZipBtn");
    var clearFileBtn = byId("clearAction");
    var fileMeta = byId("pdfToPngFileMeta");

    if (!dropzone || !input || !workspace || !pagesRoot || !exportBtn) return;

    var state = {
      file: null,
      pageCount: 0,
      pages: null,
      previewUrls: [],
      busy: false,
    };

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function revokePreviews() {
      state.previewUrls.forEach(function (url) {
        URL.revokeObjectURL(url);
      });
      state.previewUrls = [];
    }

    function updateButtons() {
      exportBtn.disabled = state.busy || !state.file;
      if (zipBtn) zipBtn.disabled = state.busy || !state.pages || !state.pages.length;
      if (clearFileBtn) clearFileBtn.disabled = state.busy;
    }

    function resetAll() {
      revokePreviews();
      state.file = null;
      state.pageCount = 0;
      state.pages = null;
      if (input) input.value = "";
      workspace.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      pagesRoot.innerHTML = "";
      if (fileMeta) fileMeta.textContent = "";
      if (zipBtn) zipBtn.classList.add("is-hidden");
      updateButtons();
      setStatus("");
    }

    function renderPages() {
      pagesRoot.innerHTML = "";
      if (!state.pages || !state.pages.length) return;
      state.pages.forEach(function (entry) {
        var card = document.createElement("div");
        card.className = "pdf-export-thumb";
        card.innerHTML =
          '<div class="pdf-export-thumb__canvas-wrap"><img class="pdf-export-thumb__img" alt="Page ' +
          entry.page +
          '" src="' +
          entry.previewUrl +
          '" /></div>' +
          '<div class="pdf-export-thumb__footer">' +
          '<span class="pdf-export-thumb__label">Page ' +
          entry.page +
          "</span>" +
          '<button type="button" class="pdf-export-thumb__download">Download PNG</button>' +
          "</div>";
        var btn = card.querySelector(".pdf-export-thumb__download");
        if (btn) {
          btn.addEventListener("click", function () {
            if (!state.file) return;
            downloadBlob(entry.blob, PDFCore.pdfToPngFileName(state.file, entry.page));
          });
        }
        pagesRoot.appendChild(card);
      });
    }

    async function loadMeta(file) {
      if (!window.pdfjsLib) throw new Error("PDF preview engine failed to load.");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      var url = URL.createObjectURL(file);
      try {
        var pdf = await pdfjsLib.getDocument(url).promise;
        state.pageCount = pdf.numPages;
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    async function acceptFile(file) {
      if (!file || !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name))) {
        setStatus("Please choose a PDF file.");
        return;
      }
      revokePreviews();
      state.file = file;
      state.pages = null;
      setStatus("Loading PDF…");
      try {
        await loadMeta(file);
      } catch (error) {
        setStatus(error && error.message ? error.message : "Could not read PDF.");
        resetAll();
        return;
      }
      dropzone.classList.add("is-hidden");
      workspace.classList.remove("is-hidden");
      if (fileMeta) {
        fileMeta.textContent =
          file.name + " · " + state.pageCount + " page" + (state.pageCount === 1 ? "" : "s");
      }
      if (zipBtn) zipBtn.classList.add("is-hidden");
      pagesRoot.innerHTML = "";
      updateButtons();
      setStatus("Ready — export pages as PNG.");
    }

    async function exportPages() {
      if (!state.file) return;
      state.busy = true;
      updateButtons();
      setStatus("Rendering " + (state.pageCount || "all") + " page(s) at " + EXPORT_SCALE + "×…");
      revokePreviews();
      state.pages = null;
      pagesRoot.innerHTML = "";
      try {
        var rendered = await PDFCore.pdfToPng(state.file, EXPORT_SCALE);
        state.pages = rendered.map(function (entry) {
          var previewUrl = URL.createObjectURL(entry.blob);
          state.previewUrls.push(previewUrl);
          return { page: entry.page, blob: entry.blob, previewUrl: previewUrl };
        });
        renderPages();
        if (zipBtn) zipBtn.classList.remove("is-hidden");
        setStatus("Exported " + state.pages.length + " PNG page(s). Download individually or as ZIP.");
      } catch (error) {
        setStatus(error && error.message ? error.message : "Export failed.");
      } finally {
        state.busy = false;
        updateButtons();
      }
    }

    async function downloadZip() {
      if (!state.file || !state.pages || !state.pages.length) return;
      state.busy = true;
      updateButtons();
      setStatus("Building ZIP…");
      try {
        var entries = state.pages.map(function (entry) {
          return {
            name: PDFCore.pdfToPngFileName(state.file, entry.page),
            blob: entry.blob,
          };
        });
        var zip = await PDFCore.zipBlobEntries(entries);
        downloadBlob(zip, PDFCore.pdfToPngZipName(state.file));
        setStatus("Downloaded ZIP with " + state.pages.length + " PNG file(s).");
      } catch (error) {
        setStatus(error && error.message ? error.message : "ZIP export failed.");
      } finally {
        state.busy = false;
        updateButtons();
      }
    }

    dropzone.addEventListener("click", function () {
      input.click();
    });
    dropzone.addEventListener("dragover", function (event) {
      event.preventDefault();
      dropzone.classList.add("drag-over");
    });
    dropzone.addEventListener("dragleave", function () {
      dropzone.classList.remove("drag-over");
    });
    dropzone.addEventListener("drop", function (event) {
      event.preventDefault();
      dropzone.classList.remove("drag-over");
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) acceptFile(file);
    });
    input.addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (file) acceptFile(file);
      event.target.value = "";
    });
    exportBtn.addEventListener("click", function () {
      exportPages();
    });
    if (zipBtn) {
      zipBtn.addEventListener("click", function () {
        downloadZip();
      });
    }
    if (clearFileBtn) {
      clearFileBtn.addEventListener("click", resetAll);
    }

    updateButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPdfToPngWorkspace);
  } else {
    initPdfToPngWorkspace();
  }
})();
