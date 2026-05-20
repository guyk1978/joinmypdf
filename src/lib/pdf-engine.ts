"use client";

import { PDFDocument } from "pdf-lib";
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
