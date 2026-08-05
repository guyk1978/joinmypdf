/**
 * Shared pdf.js setup + offscreen page rendering for UI previews.
 * Opaque white underlay prevents blank/black pages on transparent PDFs / dark chrome.
 */

import { classifyPdfError } from "@/lib/pdf-errors";
import { paintPdfPageToCanvas, type PdfPaintBackground } from "@/lib/pdf-paint";
import {
  getPdfJsDocumentAssetParams,
  setupPdfJs,
  type PdfJsDocument,
} from "@/lib/pdf-reader";

export const PDF_THUMB_SCALE = 0.35;
export const PDF_STUDIO_SCALE = 1.25;

export type PdfRenderBackground = PdfPaintBackground;

export {
  canvasHasVisibleInk,
  isPdfRenderCancelled,
  isPdfSoftRenderError,
  paintPdfPageToCanvas,
} from "@/lib/pdf-paint";

type DestroyableDoc = PdfJsDocument & { destroy?: () => Promise<void> | void };

async function destroyDoc(doc: DestroyableDoc | null | undefined) {
  if (!doc || typeof doc.destroy !== "function") return;
  try {
    await doc.destroy();
  } catch {
    /* ignore cleanup failures */
  }
}

/** Open a pdf.js document, run `fn`, always destroy the document. */
export async function withPdfDocument<T>(
  source: Uint8Array,
  password: string | undefined,
  fn: (doc: PdfJsDocument) => Promise<T>,
): Promise<T> {
  const pdfjs = await setupPdfJs();
  let doc: DestroyableDoc | null = null;
  try {
    doc = (await pdfjs.getDocument({
      data: source.slice(),
      password: password?.trim() || undefined,
      ...getPdfJsDocumentAssetParams(),
    }).promise) as DestroyableDoc;
    return await fn(doc);
  } catch (error) {
    throw classifyPdfError(error);
  } finally {
    await destroyDoc(doc);
  }
}

export async function renderPageToOffscreenCanvas(
  doc: PdfJsDocument,
  pageNumber: number,
  scale: number,
  background: PdfRenderBackground = "opaque-white",
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const canvas = document.createElement("canvas");
  await paintPdfPageToCanvas({ page: page as never, canvas, scale, background });
  return canvas;
}

export async function loadPdfPageCount(source: Uint8Array, password?: string): Promise<number> {
  return withPdfDocument(source, password, async (doc) => doc.numPages);
}

export async function renderPdfPageThumbnail(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
  scale = PDF_THUMB_SCALE,
): Promise<HTMLCanvasElement> {
  return withPdfDocument(source, password, (doc) =>
    renderPageToOffscreenCanvas(doc, pageIndex + 1, scale, "opaque-white"),
  );
}

/** Studio / overlay tools — returns canvas plus pixel size for blit targets. */
export async function renderPdfPageForUi(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
  scale = PDF_STUDIO_SCALE,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const canvas = await withPdfDocument(source, password, (doc) =>
    renderPageToOffscreenCanvas(doc, pageIndex + 1, scale, "opaque-white"),
  );
  return { canvas, width: canvas.width, height: canvas.height };
}

/** Sign PDF and similar — canvas-only return shape. */
export async function renderPdfPageCanvas(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
  scale = PDF_STUDIO_SCALE,
): Promise<HTMLCanvasElement> {
  const { canvas } = await renderPdfPageForUi(source, pageIndex, password, scale);
  return canvas;
}

export function blitCanvas(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  target.width = source.width;
  target.height = source.height;
  const ctx = target.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(source, 0, 0);
  return true;
}

export function friendlyPdfPreviewMessage(error: unknown): string {
  const classified = classifyPdfError(error);
  if (classified.kind === "encrypted") {
    return "This PDF is password-protected. Enter the password to preview pages.";
  }
  if (classified.kind === "corrupt") {
    return "This PDF could not be rendered. It may be damaged or incomplete.";
  }
  return classified.message || "Could not render this page.";
}

/** JPEG data-URL thumbnails for tools that show a full-document strip (Rotate, Booklet). */
export async function renderPdfThumbnailDataUrls(
  source: Uint8Array,
  options?: { password?: string; scale?: number; quality?: number; maxPages?: number },
): Promise<Array<{ pageIndex: number; dataUrl: string }>> {
  const scale = options?.scale ?? 0.26;
  const quality = options?.quality ?? 0.9;
  const maxPages = options?.maxPages;

  return withPdfDocument(source, options?.password, async (doc) => {
    const thumbs: Array<{ pageIndex: number; dataUrl: string }> = [];
    const limit =
      typeof maxPages === "number" ? Math.min(doc.numPages, Math.max(0, maxPages)) : doc.numPages;

    for (let i = 1; i <= limit; i += 1) {
      const canvas = await renderPageToOffscreenCanvas(doc, i, scale, "opaque-white");
      thumbs.push({
        pageIndex: i - 1,
        dataUrl: canvas.toDataURL("image/jpeg", quality),
      });
    }

    return thumbs;
  });
}
