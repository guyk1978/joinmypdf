"use client";

import { PDFDocument } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

async function loadPdfLibDocument(bytes: ArrayBuffer) {
  try {
    return await PDFDocument.load(bytes);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  const valid = (files || []).filter(Boolean);
  if (valid.length < 2) throw new Error("Add at least 2 PDF files.");
  const merged = await PDFDocument.create();
  for (const f of valid) {
    const source = await loadPdfLibDocument(await f.arrayBuffer());
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

export async function compressSimulation(file: File, quality: number) {
  if (!file) throw new Error("No PDF file selected.");
  const doc = await loadPdfLibDocument(await file.arrayBuffer());
  const output = await doc.save({ useObjectStreams: true });
  const ratio = Math.max(0.55, Math.min(0.95, Number(quality || 0.75)));
  return { bytes: output, estimatedRatio: ratio };
}

export async function splitPdfFile(file: File) {
  if (!file) throw new Error("No PDF file selected.");
  const source = await loadPdfLibDocument(await file.arrayBuffer());
  const result: { page: number; bytes: Uint8Array }[] = [];
  for (const pageIndex of source.getPageIndices()) {
    const out = await PDFDocument.create();
    const [copy] = await out.copyPages(source, [pageIndex]);
    out.addPage(copy);
    result.push({ page: pageIndex + 1, bytes: await out.save() });
  }
  return result;
}

export async function jpgToPdf(files: File[]) {
  const valid = (files || []).filter(Boolean);
  if (!valid.length) throw new Error("Add at least one image.");
  const doc = await PDFDocument.create();
  for (const file of valid) {
    const bytes = await file.arrayBuffer();
    const isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name);
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return doc.save();
}

export async function pngToPdf(files: File[]): Promise<Uint8Array> {
  const { pngToPdfBytes } = await import("./png-to-pdf");
  try {
    return await pngToPdfBytes(files);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pngToPdfOutputName(files: File[]) {
  const first = files[0];
  const base = first?.name.replace(/\.png$/i, "") || "images";
  return `${base}-converted.pdf`;
}

function isPdfFile(file: File, bytes?: Uint8Array) {
  if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) return true;
  if (bytes && bytes.length >= 4) {
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    return header === "%PDF";
  }
  return false;
}

export async function isPdfEncrypted(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { isPdfEncrypted: checkEncrypted } = await import("./pdf-unlock");
  return checkEncrypted(bytes);
}

export async function unlockPdfFile(file: File, password: string): Promise<Uint8Array> {
  if (!file) throw new Error("No PDF file selected.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfFile(file, bytes)) {
    throw new Error("Choose a valid PDF file.");
  }

  const { unlockPdfBytes } = await import("./pdf-unlock");
  try {
    return await unlockPdfBytes(bytes, String(password || ""));
  } catch (error) {
    const { IncorrectPasswordError } = await import("./pdf-unlock");
    if (error instanceof IncorrectPasswordError) throw error;
    throw classifyPdfError(error);
  }
}

export async function deletePdfPagesFile(
  file: File,
  pageIndicesToRemove: number[],
  orderedPageIndices?: number[],
): Promise<Uint8Array> {
  if (!file) throw new Error("No PDF file selected.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfFile(file, bytes)) {
    throw new Error("Choose a valid PDF file.");
  }

  try {
    if (orderedPageIndices?.length) {
      const removeSet = new Set(pageIndicesToRemove);
      const keep = orderedPageIndices.filter((i) => !removeSet.has(i));
      if (!keep.length) {
        throw new Error("You cannot delete every page. Keep at least one page.");
      }
      const { buildPdfFromOrderedPageIndices } = await import("./pdf-pages");
      return await buildPdfFromOrderedPageIndices(bytes, keep);
    }

    const { deletePdfPagesBytes } = await import("./pdf-delete-pages");
    return await deletePdfPagesBytes(bytes, pageIndicesToRemove);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export async function redactPdfFile(
  file: File,
  rects: import("./pdf-redact").NormalizedRedactionRect[],
  password?: string,
): Promise<Uint8Array> {
  if (!file) throw new Error("No PDF file selected.");
  if (!rects?.length) throw new Error("Draw at least one redaction box.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfFile(file, bytes)) {
    throw new Error("Choose a valid PDF file.");
  }

  const { redactPdfBytes } = await import("./pdf-redact");
  try {
    return await redactPdfBytes(bytes, rects, { password });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export async function addPageNumbersFile(
  file: File,
  options: import("./add-page-numbers").AddPageNumbersOptions,
): Promise<Uint8Array> {
  if (!file) throw new Error("No PDF file selected.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfFile(file, bytes)) {
    throw new Error("Choose a valid PDF file.");
  }

  const { addPageNumbersBytes } = await import("./add-page-numbers");
  try {
    return await addPageNumbersBytes(file, options);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function addPageNumbersOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-numbered.pdf`;
}

export async function signPdfFile(
  file: File,
  stamps: import("./pdf-sign").SignatureStamp[],
  password?: string,
  textStamps?: import("./pdf-sign").TextStamp[],
): Promise<Uint8Array> {
  if (!file) throw new Error("No PDF file selected.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfFile(file, bytes)) {
    throw new Error("Choose a valid PDF file.");
  }

  const { signPdfBytes } = await import("./pdf-sign");
  try {
    return await signPdfBytes(bytes, stamps, { password, textStamps });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export async function protectPdfFile(file: File, password: string): Promise<Uint8Array> {
  if (!file) throw new Error("No PDF file selected.");
  const trimmed = String(password || "").trim();
  if (!trimmed) throw new Error("Enter a password.");
  if (trimmed.length < 4) throw new Error("Use a password with at least 4 characters.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfFile(file, bytes)) {
    throw new Error("Choose a valid PDF file.");
  }

  const { protectPdfBytes } = await import("./pdf-protect");
  try {
    return await protectPdfBytes(bytes, trimmed);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export async function pdfToPngPages(file: File, scale = 2.0) {
  const { pdfToPngPages: renderPages } = await import("./pdf-to-png");
  try {
    return await renderPages(file, scale);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToPngFileName(file: File, page: number) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-page-${page}.png`;
}

export function pdfToPngZipName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-pages.zip`;
}

export async function pdfToJpgPages(file: File, scale = 1.25) {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  const url = URL.createObjectURL(file);
  try {
    let pdf;
    try {
      pdf = await pdfjs.getDocument({ url }).promise;
    } catch (error) {
      throw classifyPdfError(error);
    }
    const pages: { page: number; blob: Blob }[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported.");
      const task = page.render({ canvasContext: ctx, viewport, canvas } as never);
      await task.promise;
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
      if (!blob) throw new Error("JPG export failed.");
      pages.push({ page: i, blob });
    }
    return pages;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(idx ? 1 : 0)} ${units[idx]}`;
}

export async function renderFirstPagePreview(file: File, scale = 0.35) {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  const url = URL.createObjectURL(file);
  try {
    let pdf;
    try {
      pdf = await pdfjs.getDocument({ url }).promise;
    } catch (error) {
      throw classifyPdfError(error);
    }
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");
    const task = page.render({ canvasContext: ctx, viewport, canvas } as never);
    await task.promise;
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
