/* global PDFLib, pdfjsLib */
(function () {
  "use strict";

  let workerReady = false;

  function ensureDeps() {
    if (!window.PDFLib) {
      throw new Error("PDF engine failed to load (pdf-lib missing).");
    }
  }

  function ensureWorker() {
    if (workerReady) return;
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
    workerReady = true;
  }

  async function mergePdfFiles(files) {
    ensureDeps();
    const validFiles = (files || []).filter(Boolean);
    if (validFiles.length < 2) throw new Error("Add at least 2 PDF files.");
    const merged = await PDFLib.PDFDocument.create();
    for (const file of validFiles) {
      const source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }
    return merged.save();
  }

  async function compressSimulation(file, quality) {
    ensureDeps();
    if (!file) throw new Error("No PDF file selected.");
    const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    const output = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 80,
    });
    const ratio = Math.max(0.55, Math.min(0.95, Number(quality || 0.75)));
    return {
      bytes: output,
      estimatedRatio: ratio,
      estimatedCompressedBytes: Math.round(output.length * ratio),
    };
  }

  async function splitPdfFile(file) {
    ensureDeps();
    if (!file) throw new Error("No PDF file selected.");
    const source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    const result = [];
    for (const pageIndex of source.getPageIndices()) {
      const out = await PDFLib.PDFDocument.create();
      const copied = await out.copyPages(source, [pageIndex]);
      out.addPage(copied[0]);
      result.push({ page: pageIndex + 1, bytes: await out.save() });
    }
    return result;
  }

  async function splitPdf(file) {
    return splitPdfFile(file);
  }

  async function jpgToPdf(files) {
    ensureDeps();
    const validFiles = (files || []).filter(Boolean);
    if (!validFiles.length) throw new Error("Add at least one image.");
    const doc = await PDFLib.PDFDocument.create();
    for (const file of validFiles) {
      const bytes = await file.arrayBuffer();
      const isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name);
      const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const page = doc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    return doc.save();
  }

  async function pdfToJpg(file, scale) {
    ensureWorker();
    if (!window.pdfjsLib) throw new Error("PDF preview engine failed to load.");
    if (!file) throw new Error("No PDF file selected.");
    const url = URL.createObjectURL(file);
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale || 1.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
        pages.push({ page: i, blob });
      }
      return pages;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function renderFirstPagePreview(file, scale) {
    ensureWorker();
    if (!window.pdfjsLib) throw new Error("PDF preview engine failed to load.");
    const url = URL.createObjectURL(file);
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: scale || 0.35 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, idx);
    return value.toFixed(idx ? 1 : 0) + " " + units[idx];
  }

  async function protectPdfFile(file, password) {
    if (!file) throw new Error("No PDF file selected.");
    const trimmed = String(password || "").trim();
    if (!trimmed) throw new Error("Enter a password.");
    if (trimmed.length < 4) throw new Error("Use a password with at least 4 characters.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) &&
      !(bytes.length >= 4 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "%PDF")
    ) {
      throw new Error("Choose a valid PDF file.");
    }

    ensureDeps();
    if (typeof PDFLib.PDFDocument.prototype.encrypt !== "function") {
      throw new Error("PDF protection requires pdf-lib with encryption support.");
    }

    const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    await doc.encrypt({
      userPassword: trimmed,
      ownerPassword: trimmed,
      permissions: {
        printing: "highResolution",
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false,
      },
    });
    return doc.save({ useObjectStreams: false });
  }

  async function isPdfEncrypted(file) {
    ensureDeps();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.isEncrypted;
  }

  async function unlockPdfFile(file, password) {
    if (!file) throw new Error("No PDF file selected.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) &&
      !(bytes.length >= 4 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "%PDF")
    ) {
      throw new Error("Choose a valid PDF file.");
    }

    ensureDeps();
    const trimmed = String(password || "");
    try {
      const loadOptions = trimmed ? { password: trimmed } : {};
      const doc = await PDFLib.PDFDocument.load(bytes, loadOptions);
      return doc.save({ useObjectStreams: false });
    } catch (error) {
      const msg = error && error.message ? String(error.message) : "";
      const name = error && error.name ? String(error.name) : "";
      const isEncrypted =
        name === "EncryptedPDFError" || /encrypted/i.test(msg);
      const looksWrong =
        trimmed &&
        (isEncrypted ||
          /incorrect password|wrong password|invalid password|bad password|password.*(fail|invalid|incorrect|wrong)|decrypt|authentication/i.test(
            msg,
          ));
      if (looksWrong) {
        const err = new Error("Incorrect password. Please try again.");
        err.name = "IncorrectPasswordError";
        throw err;
      }
      throw error;
    }
  }

  const REDACT_UI_SCALE = 1.25;
  const REDACT_FLATTEN_SCALE = 2;

  function ensurePdfJs() {
    if (!window.pdfjsLib) throw new Error("PDF preview engine failed to load (pdf.js missing).");
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  async function renderPdfJsPage(pdfDoc, pageNumber, scale) {
    ensurePdfJs();
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    return canvas;
  }

  function canvasToJpegBytes(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) {
          if (!blob) {
            reject(new Error("Failed to encode redacted page."));
            return;
          }
          blob.arrayBuffer().then(function (buf) {
            resolve(new Uint8Array(buf));
          }, reject);
        },
        "image/jpeg",
        quality || 0.92,
      );
    });
  }

  async function loadPdfPageCount(bytes, password) {
    ensurePdfJs();
    const doc = await pdfjsLib.getDocument({
      data: bytes.slice ? bytes.slice() : new Uint8Array(bytes),
      password: password || undefined,
    }).promise;
    return doc.numPages;
  }

  async function renderPdfPageForUi(bytes, pageIndex, password, scale) {
    ensurePdfJs();
    const doc = await pdfjsLib.getDocument({
      data: bytes.slice ? bytes.slice() : new Uint8Array(bytes),
      password: password || undefined,
    }).promise;
    const canvas = await renderPdfJsPage(doc, pageIndex + 1, scale || REDACT_UI_SCALE);
    return canvas;
  }

  async function redactPdfFile(file, rects, password) {
    if (!file) throw new Error("No PDF file selected.");
    if (!rects || !rects.length) throw new Error("Draw at least one redaction box.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) &&
      !(bytes.length >= 4 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "%PDF")
    ) {
      throw new Error("Choose a valid PDF file.");
    }

    ensureDeps();
    ensurePdfJs();
    const pwd = String(password || "").trim() || undefined;

    const pdfJsDoc = await pdfjsLib.getDocument({ data: bytes.slice(), password: pwd }).promise;

    let libDoc;
    try {
      libDoc = await PDFLib.PDFDocument.load(bytes, pwd ? { password: pwd } : {});
    } catch (_) {
      libDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    }

    if (libDoc.isEncrypted && !pwd) {
      throw new Error("This PDF is password-protected. Enter the password to redact it.");
    }

    const outDoc = await PDFLib.PDFDocument.create();
    const pageCount = libDoc.getPageCount();
    const redactedPages = {};
    rects.forEach(function (r) {
      redactedPages[r.pageIndex] = true;
    });

    for (let i = 0; i < pageCount; i += 1) {
      if (redactedPages[i]) {
        const pageRef = libDoc.getPage(i);
        const size = pageRef.getSize();
        const width = size.width;
        const height = size.height;
        const canvas = await renderPdfJsPage(pdfJsDoc, i + 1, REDACT_FLATTEN_SCALE);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000000";
        rects
          .filter(function (r) {
            return r.pageIndex === i;
          })
          .forEach(function (r) {
            ctx.fillRect(r.nx * canvas.width, r.ny * canvas.height, r.nw * canvas.width, r.nh * canvas.height);
          });
        const jpegBytes = await canvasToJpegBytes(canvas, 0.92);
        const image = await outDoc.embedJpg(jpegBytes);
        const newPage = outDoc.addPage([width, height]);
        newPage.drawImage(image, { x: 0, y: 0, width: width, height: height });
      } else {
        const copied = await outDoc.copyPages(libDoc, [i]);
        outDoc.addPage(copied[0]);
      }
    }

    return outDoc.save({ useObjectStreams: false });
  }

  var DELETE_PAGES_THUMB_SCALE = 0.35;

  async function loadPdfPageCountForDelete(bytes, password) {
    ensurePdfJs();
    const doc = await pdfjsLib.getDocument({
      data: bytes.slice ? bytes.slice() : new Uint8Array(bytes),
      password: password || undefined,
    }).promise;
    return doc.numPages;
  }

  async function renderPdfPageThumbnail(bytes, pageIndex, password, scale) {
    ensurePdfJs();
    const doc = await pdfjsLib.getDocument({
      data: bytes.slice ? bytes.slice() : new Uint8Array(bytes),
      password: password || undefined,
    }).promise;
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: scale || DELETE_PAGES_THUMB_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    return canvas;
  }

  async function deletePdfPagesFile(file, pageIndicesToRemove) {
    if (!file) throw new Error("No PDF file selected.");
    if (!pageIndicesToRemove || !pageIndicesToRemove.length) {
      throw new Error("Select at least one page to delete.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      !(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) &&
      !(bytes.length >= 4 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "%PDF")
    ) {
      throw new Error("Choose a valid PDF file.");
    }

    ensureDeps();
    const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = doc.getPageCount();
    const unique = pageIndicesToRemove
      .filter(function (v, i, arr) {
        return arr.indexOf(v) === i;
      })
      .filter(function (i) {
        return i >= 0 && i < total;
      });

    if (!unique.length) throw new Error("No valid pages selected for deletion.");
    if (unique.length >= total) throw new Error("You cannot delete every page. Keep at least one page.");

    unique.sort(function (a, b) {
      return b - a;
    });
    unique.forEach(function (index) {
      doc.removePage(index);
    });

    return doc.save({ useObjectStreams: false });
  }

  window.PDFCore = {
    mergePdfFiles,
    compressSimulation,
    splitPdfFile,
    splitPdf,
    jpgToPdf,
    pdfToJpg,
    protectPdfFile,
    unlockPdfFile,
    isPdfEncrypted,
    redactPdfFile,
    loadPdfPageCount,
    renderPdfPageForUi,
    loadPdfPageCountForDelete,
    renderPdfPageThumbnail,
    deletePdfPagesFile,
    renderFirstPagePreview,
    formatBytes,
  };
})();
