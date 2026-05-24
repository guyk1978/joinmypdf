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

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "sig-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
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

  function pngBytesToDataUrl(bytes) {
    return new Promise(function (resolve, reject) {
      var blob = new Blob([bytes], { type: "image/png" });
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result));
      };
      reader.onerror = function () {
        reject(new Error("Failed to read signature image."));
      };
      reader.readAsDataURL(blob);
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
    var savedList = byId("signSavedList");
    var libraryEmpty = byId("signLibraryEmpty");

    if (!dropzone || !input || !workspace || !pagesRoot || !primaryBtn) return;

    var state = {
      file: null,
      bytes: null,
      pageCount: 0,
      encrypted: false,
      password: "",
      activePageIndex: 0,
      savedSignatures: [],
      instances: [],
      drag: null,
      busy: false,
      padDrawing: false,
      padLast: null,
    };

    var pad = byId("signPad");
    var padCtx = pad ? pad.getContext("2d") : null;

    function savedById(id) {
      for (var i = 0; i < state.savedSignatures.length; i += 1) {
        if (state.savedSignatures[i].id === id) return state.savedSignatures[i];
      }
      return null;
    }

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
      primaryBtn.disabled = state.busy || !state.instances.length;
    }

    function renderLibrary() {
      if (!savedList || !libraryEmpty) return;
      if (!state.savedSignatures.length) {
        libraryEmpty.classList.remove("is-hidden");
        savedList.classList.add("is-hidden");
        savedList.innerHTML = "";
        return;
      }
      libraryEmpty.classList.add("is-hidden");
      savedList.classList.remove("is-hidden");
      savedList.innerHTML = "";
      state.savedSignatures.forEach(function (saved, index) {
        var li = document.createElement("li");
        li.className = "sign-saved-item";
        li.innerHTML =
          '<button type="button" class="sign-saved-item__place" title="Place on active page">' +
          '<img class="sign-saved-item__thumb" alt="" src="' +
          saved.dataUrl +
          '" /><span class="sign-saved-item__label">' +
          (saved.label || "Signature " + (index + 1)) +
          "</span></button>" +
          '<button type="button" class="sign-saved-item__delete" aria-label="Remove signature">×</button>';
        var placeBtn = li.querySelector(".sign-saved-item__place");
        var deleteBtn = li.querySelector(".sign-saved-item__delete");
        placeBtn.addEventListener("click", function () {
          addInstance(saved.id, state.activePageIndex);
          setStatus("Added signature on page " + (state.activePageIndex + 1) + ". Drag to position.");
          renderAllPlaques();
          updateButtons();
        });
        deleteBtn.addEventListener("click", function () {
          state.savedSignatures = state.savedSignatures.filter(function (s) {
            return s.id !== saved.id;
          });
          state.instances = state.instances.filter(function (inst) {
            return inst.savedId !== saved.id;
          });
          renderLibrary();
          renderAllPlaques();
          updateButtons();
        });
        savedList.appendChild(li);
      });
    }

    function resetAll() {
      state.file = null;
      state.bytes = null;
      state.pageCount = 0;
      state.savedSignatures = [];
      state.instances = [];
      state.activePageIndex = 0;
      if (input) input.value = "";
      if (passwordInput) passwordInput.value = "";
      if (passwordPanel) passwordPanel.classList.add("is-hidden");
      workspace.classList.add("is-hidden");
      dropzone.classList.remove("is-hidden");
      pagesRoot.innerHTML = "";
      if (pageSelect) pageSelect.innerHTML = "";
      if (modal) modal.classList.add("is-hidden");
      clearPad();
      renderLibrary();
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
      pageSelect.value = String(state.activePageIndex);
    }

    function addInstance(savedId, pageIndex) {
      var base = defaultPlacement(pageIndex);
      state.instances.push({
        id: createId(),
        savedId: savedId,
        pageIndex: base.pageIndex,
        nx: base.nx,
        ny: base.ny,
        nw: base.nw,
        nh: base.nh,
      });
    }

    function removeInstance(instanceId) {
      state.instances = state.instances.filter(function (inst) {
        return inst.id !== instanceId;
      });
      updateButtons();
    }

    function updateInstance(instanceId, patch) {
      state.instances = state.instances.map(function (inst) {
        if (inst.id !== instanceId) return inst;
        var next = Object.assign({}, inst);
        Object.keys(patch).forEach(function (key) {
          next[key] = patch[key];
        });
        return next;
      });
    }

    function renderPlaquesOnStage(stage, pageIndex) {
      stage.querySelectorAll(".sign-plaque").forEach(function (el) {
        el.remove();
      });
      state.instances
        .filter(function (inst) {
          return inst.pageIndex === pageIndex;
        })
        .forEach(function (inst) {
          var saved = savedById(inst.savedId);
          if (!saved) return;

          var plaque = document.createElement("div");
          plaque.className = "sign-plaque";
          plaque.setAttribute("data-instance-id", inst.id);
          plaque.style.left = inst.nx * 100 + "%";
          plaque.style.top = inst.ny * 100 + "%";
          plaque.style.width = inst.nw * 100 + "%";
          plaque.style.height = inst.nh * 100 + "%";
          plaque.innerHTML =
            '<img class="sign-plaque__img" alt="Signature" src="' +
            saved.dataUrl +
            '" /><button type="button" class="sign-plaque__remove" aria-label="Remove">×</button>' +
            '<span class="sign-plaque__handle" aria-label="Resize"></span>';

          var handle = plaque.querySelector(".sign-plaque__handle");
          var removeBtn = plaque.querySelector(".sign-plaque__remove");

          removeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            removeInstance(inst.id);
            renderAllPlaques();
          });

          plaque.addEventListener("pointerdown", function (e) {
            if (e.target === handle || e.target === removeBtn) return;
            if (e.button !== 0) return;
            e.stopPropagation();
            var rect = stage.getBoundingClientRect();
            state.drag = {
              type: "move",
              instanceId: inst.id,
              pageIndex: pageIndex,
              startX: e.clientX - rect.left,
              startY: e.clientY - rect.top,
              orig: { nx: inst.nx, ny: inst.ny, nw: inst.nw, nh: inst.nh },
            };
          });

          handle.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            e.stopPropagation();
            var rect = stage.getBoundingClientRect();
            state.drag = {
              type: "resize",
              instanceId: inst.id,
              pageIndex: pageIndex,
              startX: e.clientX - rect.left,
              startY: e.clientY - rect.top,
              orig: { nx: inst.nx, ny: inst.ny, nw: inst.nw, nh: inst.nh },
            };
          });

          stage.appendChild(plaque);
        });
    }

    function onStagePointerMove(e, stage, pageIndex) {
      if (!state.drag || state.drag.pageIndex !== pageIndex) return;
      var inst = state.instances.find(function (i) {
        return i.id === state.drag.instanceId;
      });
      if (!inst) return;
      var rect = stage.getBoundingClientRect();
      var w = rect.width || 1;
      var h = rect.height || 1;
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var dx = (x - state.drag.startX) / w;
      var dy = (y - state.drag.startY) / h;
      var o = state.drag.orig;
      if (state.drag.type === "move") {
        updateInstance(inst.id, {
          nx: clamp01(o.nx + dx),
          ny: clamp01(o.ny + dy),
        });
      } else {
        updateInstance(inst.id, {
          nw: clamp01(Math.max(0.08, o.nw + dx)),
          nh: clamp01(Math.max(0.04, o.nh + dy)),
        });
      }
      renderAllPlaques();
    }

    function renderAllPlaques() {
      pagesRoot.querySelectorAll(".sign-page__stage").forEach(function (stage) {
        var idx = Number(stage.getAttribute("data-page-index"));
        renderPlaquesOnStage(stage, idx);
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
              renderPlaquesOnStage(stage, pageIndex);
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
      state.file = file;
      state.bytes = new Uint8Array(await file.arrayBuffer());
      state.savedSignatures = [];
      state.instances = [];
      state.activePageIndex = 0;
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
      renderLibrary();
      await renderPages();
      setStatus("Create a signature, then click it to place on the document.");
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

    async function registerSignature(bytes, label) {
      var dataUrl = await pngBytesToDataUrl(bytes);
      var saved = {
        id: createId(),
        dataUrl: dataUrl,
        pngBytes: bytes,
        label: label || "Signature",
      };
      state.savedSignatures.push(saved);
      addInstance(saved.id, state.activePageIndex);
      renderLibrary();
      renderAllPlaques();
      closeModal();
      setStatus("Signature saved. Click it again to add more copies, or drag to position.");
      updateButtons();
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
      await registerSignature(bytes, "Drawn signature");
    }

    async function saveSignatureFromType() {
      var nameInput = byId("signTypeName");
      var name = nameInput ? nameInput.value : "";
      var bytes = await createTypedSignaturePng(name);
      await registerSignature(bytes, String(name).trim());
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
        var run = tab === "type" ? saveSignatureFromType : saveSignatureFromDraw;
        run().catch(function (err) {
          showModalError(err.message || "Could not create signature.");
        });
      });

    if (pageSelect) {
      pageSelect.addEventListener("change", function () {
        state.activePageIndex = Number(pageSelect.value);
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
      if (!state.file || !state.instances.length) return;
      var stamps = state.instances.map(function (inst) {
        var saved = savedById(inst.savedId);
        if (!saved) throw new Error("A placed signature is no longer available.");
        return {
          signaturePng: saved.pngBytes,
          placement: {
            pageIndex: inst.pageIndex,
            nx: inst.nx,
            ny: inst.ny,
            nw: inst.nw,
            nh: inst.nh,
          },
        };
      });
      state.busy = true;
      updateButtons();
      setStatus("Applying signatures…");
      PDFCore.signPdfFile(state.file, stamps, state.password)
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

    renderLibrary();
    updateButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSignWorkspace);
  } else {
    initSignWorkspace();
  }
})();
