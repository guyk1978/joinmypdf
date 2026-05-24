/* global PDFCore, UICore, pdfjsLib */
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

  function initAddPageNumbersWorkspace() {
    if (document.body.getAttribute("data-tool-operation") !== "add-page-numbers") return;

    var dropzone = byId("dropzone");
    var input = byId("toolInput");
    var panel = byId("pageNumbersPanel");
    var statusEl = byId("statusText");
    var primaryBtn = byId("primaryAction");
    var clearBtn = byId("clearAction");
    var fileMeta = byId("pageNumbersFileMeta");
    var positionEl = byId("pageNumbersPosition");
    var startEl = byId("pageNumbersStart");
    var formError = byId("pageNumbersFormError");

    if (!dropzone || !input || !panel || !primaryBtn) return;

    var state = { file: null, pageCount: 0, busy: false };

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function showFormError(text) {
      if (!formError) return;
      if (text) {
        formError.textContent = text;
        formError.classList.remove("is-hidden");
      } else {
        formError.textContent = "";
        formError.classList.add("is-hidden");
      }
    }

    function getFormat() {
      var checked = document.querySelector('input[name="pageNumbersFormat"]:checked');
      return checked && checked.value === "page-of" ? "page-of" : "number";
    }

    function updateButtons() {
      primaryBtn.disabled = state.busy || !state.file;
      if (clearBtn) clearBtn.disabled = state.busy;
    }

    function resetAll() {
      state.file = null;
      state.pageCount = 0;
      if (input) input.value = "";
      panel.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      if (fileMeta) fileMeta.textContent = "";
      if (positionEl) positionEl.value = "bottom-center";
      if (startEl) startEl.value = "1";
      var numberRadio = document.querySelector('input[name="pageNumbersFormat"][value="number"]');
      if (numberRadio) numberRadio.checked = true;
      showFormError("");
      updateButtons();
      setStatus("");
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
      state.file = file;
      showFormError("");
      setStatus("Loading PDF…");
      try {
        await loadMeta(file);
      } catch (error) {
        setStatus(error && error.message ? error.message : "Could not read PDF.");
        resetAll();
        return;
      }
      dropzone.classList.add("is-hidden");
      panel.classList.remove("is-hidden");
      if (fileMeta) {
        fileMeta.textContent =
          file.name + " · " + state.pageCount + " page" + (state.pageCount === 1 ? "" : "s");
      }
      if (startEl) {
        startEl.min = "1";
        startEl.max = String(state.pageCount);
        startEl.value = "1";
      }
      updateButtons();
      setStatus("PDF ready — choose numbering options below.");
    }

    async function runNumbering() {
      if (!state.file) return;
      showFormError("");
      var start = Math.floor(Number(startEl ? startEl.value : 1));
      if (!Number.isFinite(start) || start < 1) {
        showFormError("Start page must be at least 1.");
        return;
      }
      if (state.pageCount && start > state.pageCount) {
        showFormError("Start page cannot exceed " + state.pageCount + ".");
        return;
      }

      state.busy = true;
      updateButtons();
      setStatus("Adding page numbers…");
      try {
        var bytes = await PDFCore.addPageNumbersFile(state.file, {
          position: positionEl ? positionEl.value : "bottom-center",
          startPage: start,
          format: getFormat(),
        });
        var name = PDFCore.addPageNumbersOutputName(state.file);
        downloadBlob(new Blob([bytes], { type: "application/pdf" }), name);
        setStatus("Numbered PDF downloaded as " + name + ".");
      } catch (error) {
        setStatus(error && error.message ? error.message : "Could not add page numbers.");
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
    primaryBtn.addEventListener("click", function () {
      runNumbering();
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", resetAll);
    }

    updateButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAddPageNumbersWorkspace);
  } else {
    initAddPageNumbersWorkspace();
  }
})();
