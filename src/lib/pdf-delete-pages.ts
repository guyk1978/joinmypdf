import { PDFDocument } from "pdf-lib-with-encrypt";

export const DELETE_PAGES_THUMB_SCALE = 0.35;

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function renderPdfJsPage(
  pdfDoc: Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>,
  pageNumber: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
  return canvas;
}

export async function loadPdfPageCount(source: Uint8Array, password?: string): Promise<number> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({
    data: source.slice(),
    password: password?.trim() || undefined,
  }).promise;
  return doc.numPages;
}

export async function renderPdfPageThumbnail(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
  scale = DELETE_PAGES_THUMB_SCALE,
): Promise<HTMLCanvasElement> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({
    data: source.slice(),
    password: password?.trim() || undefined,
  }).promise;
  return renderPdfJsPage(doc, pageIndex + 1, scale);
}

/** Remove pages by 0-based indices (deleted high → low). */
export async function deletePdfPagesBytes(
  source: Uint8Array,
  pageIndicesToRemove: number[],
): Promise<Uint8Array> {
  if (!pageIndicesToRemove.length) {
    throw new Error("Select at least one page to delete.");
  }

  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const unique = [...new Set(pageIndicesToRemove)].filter((i) => i >= 0 && i < total);

  if (!unique.length) {
    throw new Error("No valid pages selected for deletion.");
  }
  if (unique.length >= total) {
    throw new Error("You cannot delete every page. Keep at least one page.");
  }

  const sorted = unique.sort((a, b) => b - a);
  for (const index of sorted) {
    doc.removePage(index);
  }

  return doc.save({ useObjectStreams: false });
}
