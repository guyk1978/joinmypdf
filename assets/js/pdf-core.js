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

  window.PDFCore = {
    mergePdfFiles,
    compressSimulation,
    splitPdfFile,
    splitPdf,
    jpgToPdf,
    pdfToJpg,
    protectPdfFile,
    renderFirstPagePreview,
    formatBytes,
  };
})();
