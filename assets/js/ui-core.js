(function () {
  "use strict";

  function byId(id) {
    return id ? document.getElementById(id) : null;
  }

  function downloadBlob(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename || "download.bin";
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
    }, 1200);
  }

  function createUploader(config) {
    const state = { files: [] };
    const els = {
      dropzone: byId(config.dropzoneId),
      input: byId(config.inputId),
      list: byId(config.listId),
      preview: byId(config.previewId),
      status: byId(config.statusId),
      primaryAction: byId(config.primaryActionId),
      clearAction: byId(config.clearActionId),
    };

    function setStatus(text) {
      if (els.status) els.status.textContent = text || "";
    }

    function safeUpdateActions() {
      const minFiles = config.minFilesForAction || 1;
      if (els.primaryAction) {
        els.primaryAction.disabled = state.files.length < minFiles;
      }
      if (typeof config.onStateChange === "function") {
        config.onStateChange(state.files.slice());
      }
    }

    function removeAt(index) {
      state.files.splice(index, 1);
      renderList();
      renderPreview();
      safeUpdateActions();
    }

    function moveItem(from, to) {
      if (from === to || from < 0 || to < 0 || from >= state.files.length || to >= state.files.length) return;
      const moved = state.files.splice(from, 1)[0];
      state.files.splice(to, 0, moved);
      renderList();
      renderPreview();
      safeUpdateActions();
    }

    function normalizeAndAdd(rawFiles) {
      const incoming = Array.from(rawFiles || []);
      const accepted = incoming.filter(function (file) {
        return typeof config.accept === "function" ? config.accept(file) : true;
      });
      if (!accepted.length) {
        setStatus("No supported files detected.");
        return;
      }
      if (els.input && !els.input.multiple) {
        state.files = [accepted[0]];
      } else {
        state.files.push.apply(state.files, accepted);
      }
      renderList();
      renderPreview();
      safeUpdateActions();
      setStatus(accepted.length + " file(s) added.");
    }

    function renderList() {
      if (!els.list) return;
      els.list.innerHTML = "";
      state.files.forEach(function (file, idx) {
        const row = document.createElement("div");
        row.className = "file-item";
        row.draggable = true;
        row.dataset.index = String(idx);
        const sizeText = window.PDFCore && typeof PDFCore.formatBytes === "function"
          ? PDFCore.formatBytes(file.size)
          : file.size + " B";
        row.innerHTML =
          '<span class="drag-handle" title="Drag to reorder">::</span>' +
          '<div class="file-meta"><strong>' +
          file.name +
          "</strong><span>" +
          sizeText +
          "</span></div>" +
          '<button type="button" class="btn btn--ghost">Remove</button>' +
          "<span>" +
          (idx + 1) +
          "</span>";

        row.addEventListener("dragstart", function (event) {
          event.dataTransfer.setData("text/plain", String(idx));
        });
        row.addEventListener("dragover", function (event) {
          event.preventDefault();
        });
        row.addEventListener("drop", function (event) {
          event.preventDefault();
          const from = Number(event.dataTransfer.getData("text/plain"));
          moveItem(from, idx);
        });
        const btn = row.querySelector("button");
        if (btn) {
          btn.addEventListener("click", function () {
            removeAt(idx);
          });
        }
        els.list.appendChild(row);
      });
    }

    function renderPreview() {
      if (!els.preview) return;
      els.preview.innerHTML = "";
      const io = new IntersectionObserver(
        async function (entries, observer) {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const slot = entry.target;
            const index = Number(slot.dataset.index);
            const file = state.files[index];
            if (!file || slot.dataset.done === "1") continue;
            slot.dataset.done = "1";
            try {
              const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
              if (isPdf && window.PDFCore && typeof PDFCore.renderFirstPagePreview === "function") {
                const canvas = await PDFCore.renderFirstPagePreview(file, 0.3);
                slot.replaceChildren(canvas);
              } else {
                const img = document.createElement("img");
                img.alt = file.name;
                img.src = URL.createObjectURL(file);
                img.style.width = "100%";
                img.style.borderRadius = "8px";
                slot.replaceChildren(img);
              }
            } catch (error) {
              slot.textContent = "Preview unavailable";
            } finally {
              observer.unobserve(slot);
            }
          }
        },
        { rootMargin: "140px" }
      );

      state.files.slice(0, config.previewLimit || 12).forEach(function (_, idx) {
        const slot = document.createElement("div");
        slot.className = "glass";
        slot.dataset.index = String(idx);
        slot.style.minHeight = "90px";
        slot.style.display = "grid";
        slot.style.placeItems = "center";
        slot.textContent = "Loading...";
        els.preview.appendChild(slot);
        io.observe(slot);
      });
    }

    function reset() {
      state.files = [];
      if (els.input) els.input.value = "";
      renderList();
      renderPreview();
      safeUpdateActions();
      setStatus("");
    }

    function bindEvents() {
      if (els.input) {
        els.input.addEventListener("change", function (event) {
          normalizeAndAdd(event.target.files);
        });
      }
      if (els.dropzone) {
        els.dropzone.addEventListener("click", function () {
          if (els.input) els.input.click();
        });
        els.dropzone.addEventListener("dragover", function (event) {
          event.preventDefault();
          els.dropzone.classList.add("drag-over");
        });
        els.dropzone.addEventListener("dragleave", function () {
          els.dropzone.classList.remove("drag-over");
        });
        els.dropzone.addEventListener("drop", function (event) {
          event.preventDefault();
          els.dropzone.classList.remove("drag-over");
          normalizeAndAdd(event.dataTransfer.files);
        });
      }
      if (els.clearAction) {
        els.clearAction.addEventListener("click", reset);
      }
      if (els.primaryAction && typeof config.onPrimaryAction === "function") {
        els.primaryAction.addEventListener("click", async function () {
          let succeeded = false;
          try {
            els.primaryAction.disabled = true;
            setStatus("Processing files...");
            await config.onPrimaryAction(state.files.slice(), { setStatus, reset, downloadBlob });
            succeeded = true;
          } catch (error) {
            setStatus(error && error.message ? error.message : "Operation failed.");
          } finally {
            safeUpdateActions();
            if (succeeded) {
              try {
                window.dispatchEvent(new CustomEvent("joinmypdf:tool-complete", {
                  detail: { tool: config.toolName || (document.body && document.body.dataset.tool) || "" },
                }));
              } catch (_) {}
            }
          }
        });
      }
    }

    bindEvents();
    safeUpdateActions();
    return { state, reset, addFiles: normalizeAndAdd, setStatus };
  }

  window.UICore = { createUploader, downloadBlob };
})();
