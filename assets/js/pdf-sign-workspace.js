/* global PDFCore, UICore, pdfjsLib */
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

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function defaultPlacement(pageIndex) {
    return { pageIndex: pageIndex || 0, nx: 0.32, ny: 0.78, nw: 0.36, nh: 0.1 };
  }

  function canvasToPngBytes(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) {
          if (!blob) {
            reject(new Error("Failed to export signature."));
            return;
          }
          blob.arrayBuffer().then(function (buf) {
            resolve(new Uint8Array(buf));
          });
        },
        "image/png",
      );
    });
  }

  function createTypedSignaturePng(text) {
    var trimmed = String(text || "").trim();
    if (!trimmed) return Promise.reject(new Error("Enter your name to create a signature."));
    var canvas = document.createElement("canvas");
    canvas.width = 560;
    canvas.height = 180;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '56px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(trimmed, canvas.width / 2, canvas.height / 2);
    return canvasToPngBytes(canvas);
  }

  function initSignWorkspace() {
    if (document.body.getAttribute("data-tool-operation") !== "sign") return;

    var dropzone = byId("dropzone");
    var input = byId("toolInput");
    var workspace = byId("signWorkspace");
    var pagesRoot = byId("signPages");
    var statusEl = byId("statusText");
    var primaryBtn = byId("primaryAction");
    var clearBtn = byId("clearAction");
    var createBtn = byId("signCreateBtn");
    var pageSelect = byId("signPageSelect");
    var passwordInput = byId("signPassword");
    var passwordPanel = byId("signPasswordPanel");
    var loadPagesBtn = byId("signLoadPages");
    var modal = byId("signModal");
    var modalError = byId("signModalError");

    if (!dropzone || !input || !workspace || !pagesRoot || !primaryBtn) return;

    var state = {
      file: null,
      bytes: null,
      pageCount: 0,
      encrypted: false,
      password: "",
      signaturePng: null,
      signatureUrl: null,
      placement: null,
      drag: null,
      busy: false,
      padDrawing: false,
      padLast: null,
    };

    var pad = byId("signPad");
    var padCtx = pad ? pad.getContext("2d") : null;

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function showModalError(text) {
      if (!modalError) return;
      if (text) {
        modalError.textContent = text;
        modalError.classList.remove("is-hidden");
      } else {
        modalError.textContent = "";
        modalError.classList.add("is-hidden");
      }
    }

    function updateButtons() {
      primaryBtn.disabled = state.busy || !state.signaturePng || !state.placement;
    }

    function revokeSignatureUrl() {
      if (state.signatureUrl) URL.revokeObjectURL(state.signatureUrl);
    }

    function resetAll() {
      revokeSignatureUrl();
      state.file = null;
      state.bytes = null;
      state.pageCount = 0;
      state.signaturePng = null;
      state.signatureUrl = null;
      state.placement = null;
      if (input) input.value = "";
      if (passwordInput) passwordInput.value = "";
      if (passwordPanel) passwordPanel.classList.add("is-hidden");
      workspace.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      pagesRoot.innerHTML = "";
      if (pageSelect) pageSelect.innerHTML = "";
      if (modal) modal.classList.add("is-hidden");
      clearPad();
      updateButtons();
      setStatus("");
    }

    function clearPad() {
      if (!pad || !padCtx) return;
      padCtx.clearRect(0, 0, pad.width, pad.height);
    }

    function fillPageSelect() {
      if (!pageSelect) return;
      pageSelect.innerHTML = "";
      for (var i = 0; i < state.pageCount; i += 1) {
        var opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = "Page " + (i + 1);
        pageSelect.appendChild(opt);
      }
      if (state.placement) pageSelect.value = String(state.placement.pageIndex);
    }

    function renderPlaque(stage, pageIndex) {
      var existing = stage.querySelector(".sign-plaque");
      if (existing) existing.remove();
      if (!state.signatureUrl || !state.placement || state.placement.pageIndex !== pageIndex) return;

      var p = state.placement;
      var plaque = document.createElement("div");
      plaque.className = "sign-plaque";
      plaque.style.left = p.nx * 100 + "%";
      plaque.style.top = p.ny * 100 + "%";
      plaque.style.width = p.nw * 100 + "%";
      plaque.style.height = p.nh * 100 + "%";
      plaque.innerHTML =
        '<img class="sign-plaque__img" alt="Your signature" src="' +
        state.signatureUrl +
        '" /><span class="sign-plaque__handle" aria-label="Resize"></span>';

      var handle = plaque.querySelector(".sign-plaque__handle");

      plaque.addEventListener("pointerdown", function (e) {
        if (e.target === handle) return;
        if (e.button !== 0) return;
        e.stopPropagation();
        var rect = stage.getBoundingClientRect();
        state.drag = {
          type: "move",
          pageIndex: pageIndex,
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          orig: Object.assign({}, p),
        };
      });

      if (handle) {
        handle.addEventListener("pointerdown", function (e) {
          if (e.button !== 0) return;
          e.stopPropagation();
          var rect = stage.getBoundingClientRect();
          state.drag = {
            type: "resize",
            pageIndex: pageIndex,
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            orig: Object.assign({}, p),
          };
        });
      }

      stage.appendChild(plaque);
    }

    function onStagePointerMove(e, stage, pageIndex) {
      if (!state.drag || state.drag.pageIndex !== pageIndex || !state.placement) return;
      var rect = stage.getBoundingClientRect();
      var w = rect.width || 1;
      var h = rect.height || 1;
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var dx = (x - state.drag.startX) / w;
      var dy = (y - state.drag.startY) / h;
      var o = state.drag.orig;
      if (state.drag.type === "move") {
        state.placement = {
          pageIndex: pageIndex,
          nx: clamp01(o.nx + dx),
          ny: clamp01(o.ny + dy),
          nw: o.nw,
          nh: o.nh,
        };
      } else {
        state.placement = {
          pageIndex: pageIndex,
          nx: o.nx,
          ny: o.ny,
          nw: clamp01(Math.max(0.08, o.nw + dx)),
          nh: clamp01(Math.max(0.04, o.nh + dy)),
        };
      }
      renderAllPlaques();
      if (pageSelect) pageSelect.value = String(pageIndex);
    }

    function renderAllPlaques() {
      var stages = pagesRoot.querySelectorAll(".sign-page__stage");
      stages.forEach(function (stage) {
        var idx = Number(stage.getAttribute("data-page-index"));
        renderPlaque(stage, idx);
      });
    }

    async function renderPages() {
      pagesRoot.innerHTML = "";
      for (var i = 0; i < state.pageCount; i += 1) {
        (function (pageIndex) {
          var wrap = document.createElement("div");
          wrap.className = "sign-page";
          wrap.innerHTML =
            '<p class="sign-page__label">Page ' +
            (pageIndex + 1) +
            '</p><div class="sign-page__stage" data-page-index="' +
            pageIndex +
            '"><p class="sign-page__loading">Rendering…</p></div>';
          pagesRoot.appendChild(wrap);
          var stage = wrap.querySelector(".sign-page__stage");
          PDFCore.renderPdfPageForUi(state.bytes, pageIndex, state.password, UI_SCALE)
            .then(function (canvas) {
              stage.innerHTML = "";
              canvas.className = "sign-page__canvas";
              stage.appendChild(canvas);
              renderPlaque(stage, pageIndex);
              stage.addEventListener("pointermove", function (e) {
                onStagePointerMove(e, stage, pageIndex);
              });
              stage.addEventListener("pointerup", function () {
                state.drag = null;
              });
              stage.addEventListener("pointerleave", function () {
                state.drag = null;
              });
            })
            .catch(function () {
              stage.textContent = "Could not render page.";
            });
        })(i);
      }
    }

    async function acceptFile(file) {
      if (!file || !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name))) {
        setStatus("Please choose a PDF file.");
        return;
      }
      revokeSignatureUrl();
      state.file = file;
      state.bytes = new Uint8Array(await file.arrayBuffer());
      state.signaturePng = null;
      state.signatureUrl = null;
      state.placement = null;
      state.password = "";
      setStatus("Loading PDF…");
      try {
        state.pageCount = await PDFCore.loadPdfPageCount(state.bytes, "");
        state.encrypted = false;
        try {
          state.encrypted = await PDFCore.isPdfEncrypted(file);
        } catch (_) {
          state.encrypted = false;
        }
      } catch (_) {
        setStatus("Could not open PDF. Enter password if protected.");
        state.pageCount = 0;
      }
      dropzone.classList.add("is-hidden");
      workspace.classList.remove("is-hidden");
      if (passwordPanel) passwordPanel.classList.toggle("is-hidden", !state.encrypted);
      fillPageSelect();
      await renderPages();
      setStatus("Create your signature and place it on the page.");
      updateButtons();
    }

    async function reloadWithPassword() {
      if (!state.bytes) return;
      try {
        state.pageCount = await PDFCore.loadPdfPageCount(state.bytes, state.password);
        fillPageSelect();
        await renderPages();
        setStatus("Loaded " + state.pageCount + " page(s).");
      } catch (_) {
        setStatus("Could not open with that password.");
      }
    }

    function openModal() {
      if (modal) modal.classList.remove("is-hidden");
      showModalError("");
      clearPad();
    }

    function closeModal() {
      if (modal) modal.classList.add("is-hidden");
    }

    async function saveSignatureFromDraw() {
      if (!pad || !padCtx) return;
      var pixels = padCtx.getImageData(0, 0, pad.width, pad.height).data;
      var hasInk = false;
      for (var i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) {
          hasInk = true;
          break;
        }
      }
      if (!hasInk) {
        showModalError("Draw your signature on the pad first.");
        return;
      }
      var bytes = await canvasToPngBytes(pad);
      revokeSignatureUrl();
      state.signaturePng = bytes;
      state.signatureUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
      state.placement = defaultPlacement(pageSelect ? Number(pageSelect.value) : 0);
      fillPageSelect();
      renderAllPlaques();
      closeModal();
      setStatus("Drag and resize your signature, then click Sign & Download PDF.");
      updateButtons();
    }

    async function saveSignatureFromType() {
      var nameInput = byId("signTypeName");
      var bytes = await createTypedSignaturePng(nameInput ? nameInput.value : "");
      revokeSignatureUrl();
      state.signaturePng = bytes;
      state.signatureUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
      state.placement = defaultPlacement(pageSelect ? Number(pageSelect.value) : 0);
      fillPageSelect();
      renderAllPlaques();
      closeModal();
      setStatus("Drag and resize your signature, then click Sign & Download PDF.");
      updateButtons();
    }

    if (pad) {
      pad.addEventListener("pointerdown", function (e) {
        pad.setPointerCapture(e.pointerId);
        state.padDrawing = true;
        var rect = pad.getBoundingClientRect();
        var scaleX = pad.width / rect.width;
        var scaleY = pad.height / rect.height;
        state.padLast = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
      });
      pad.addEventListener("pointermove", function (e) {
        if (!state.padDrawing || !padCtx || !state.padLast) return;
        var rect = pad.getBoundingClientRect();
        var scaleX = pad.width / rect.width;
        var scaleY = pad.height / rect.height;
        var x = (e.clientX - rect.left) * scaleX;
        var y = (e.clientY - rect.top) * scaleY;
        padCtx.strokeStyle = "#0f172a";
        padCtx.lineWidth = 2.5;
        padCtx.lineCap = "round";
        padCtx.beginPath();
        padCtx.moveTo(state.padLast.x, state.padLast.y);
        padCtx.lineTo(x, y);
        padCtx.stroke();
        state.padLast = { x: x, y: y };
      });
      pad.addEventListener("pointerup", function () {
        state.padDrawing = false;
        state.padLast = null;
      });
    }

    byId("signPadClear") &&
      byId("signPadClear").addEventListener("click", function () {
        clearPad();
      });

    document.querySelectorAll("[data-sign-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-sign-tab");
        document.querySelectorAll("[data-sign-tab]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        byId("signTabDraw").classList.toggle("is-hidden", tab !== "draw");
        byId("signTabType").classList.toggle("is-hidden", tab !== "type");
      });
    });

    byId("signTypeName") &&
      byId("signTypeName").addEventListener("input", function (e) {
        var preview = byId("signTypePreview");
        if (preview) preview.textContent = e.target.value || "Preview";
      });

    createBtn &&
      createBtn.addEventListener("click", function () {
        openModal();
      });
    byId("signModalClose") &&
      byId("signModalClose").addEventListener("click", closeModal);
    byId("signModalCancel") &&
      byId("signModalCancel").addEventListener("click", closeModal);
    byId("signModalSave") &&
      byId("signModalSave").addEventListener("click", function () {
        var active = document.querySelector(".sign-tabs__btn.is-active");
        var tab = active ? active.getAttribute("data-sign-tab") : "draw";
        showModalError("");
        if (tab === "type") {
          saveSignatureFromType().catch(function (err) {
            showModalError(err.message || "Could not create signature.");
          });
        } else {
          saveSignatureFromDraw().catch(function (err) {
            showModalError(err.message || "Could not create signature.");
          });
        }
      });

    if (pageSelect) {
      pageSelect.addEventListener("change", function () {
        if (!state.placement) return;
        state.placement.pageIndex = Number(pageSelect.value);
        renderAllPlaques();
      });
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
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) acceptFile(file);
    });
    input.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) acceptFile(file);
      e.target.value = "";
    });
    if (loadPagesBtn) {
      loadPagesBtn.addEventListener("click", function () {
        state.password = passwordInput ? passwordInput.value : "";
        reloadWithPassword();
      });
    }
    primaryBtn.addEventListener("click", function () {
      if (!state.file || !state.signaturePng || !state.placement) return;
      state.busy = true;
      updateButtons();
      setStatus("Applying signature…");
      PDFCore.signPdfFile(state.file, state.signaturePng, state.placement, state.password)
        .then(function (bytes) {
          downloadBlob(new Blob([bytes], { type: "application/pdf" }), PDFCore.signPdfOutputName(state.file));
          setStatus("Signed PDF downloaded.");
        })
        .catch(function (err) {
          setStatus(err.message || "Signing failed.");
        })
        .finally(function () {
          state.busy = false;
          updateButtons();
        });
    });
    if (clearBtn) clearBtn.addEventListener("click", resetAll);

    updateButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSignWorkspace);
  } else {
    initSignWorkspace();
  }
})();
