/** Client-side PDF.js helpers for the PDF Reader Online tool. */

import {
  canvasHasVisibleInk,
  isPdfRenderCancelled,
  isPdfSoftRenderError,
  paintPdfPageToCanvas,
} from "@/lib/pdf-paint";

export type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  destroy: () => Promise<void>;
};

type PdfJsPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: never) => { promise: Promise<void>; cancel?: () => void };
  getTextContent: () => Promise<{ items?: unknown[] } | unknown>;
};

type PdfJsModule = {
  version?: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: Record<string, unknown>) => { promise: Promise<PdfJsDocument> };
  TextLayer: new (params: {
    textContentSource: unknown;
    container: HTMLElement;
    viewport: { width: number; height: number };
  }) => { render: () => Promise<void>; cancel: () => void };
};

let pdfjsModule: PdfJsModule | null = null;

function assetOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

function resolvePdfWorkerSrc(version: string): string {
  const origin = assetOrigin();
  if (origin) return `${origin}/pdfjs/pdf.worker.min.mjs`;
  return `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

/**
 * Same-origin decoder/font assets. Without wasmUrl, JBIG2/JPEG2000 scanned
 * pages often paint as blank white after a “successful” render.
 */
export function getPdfJsDocumentAssetParams(): {
  wasmUrl: string;
  cMapUrl: string;
  cMapPacked: true;
  standardFontDataUrl: string;
  useSystemFonts: true;
  useWorkerFetch: true;
} {
  const origin = assetOrigin() || "https://unpkg.com/pdfjs-dist@5.7.284";
  const base = origin.includes("unpkg.com")
    ? `${origin}/`
    : `${origin}/pdfjs/`;
  // unpkg layout differs; prefer same-origin public/pdfjs when available.
  if (!origin.includes("unpkg.com")) {
    return {
      wasmUrl: `${base}wasm/`,
      cMapUrl: `${base}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${base}standard_fonts/`,
      useSystemFonts: true,
      useWorkerFetch: true,
    };
  }
  return {
    wasmUrl: `https://unpkg.com/pdfjs-dist@5.7.284/wasm/`,
    cMapUrl: `https://unpkg.com/pdfjs-dist@5.7.284/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.7.284/standard_fonts/`,
    useSystemFonts: true,
    useWorkerFetch: true,
  };
}

export async function setupPdfJs(): Promise<PdfJsModule> {
  if (pdfjsModule) return pdfjsModule;
  const pdfjs = (await import("pdfjs-dist")) as unknown as PdfJsModule;
  const version = pdfjs.version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc(version);
  pdfjsModule = pdfjs;
  return pdfjs;
}

/** Reset cached module (e.g. after worker path recovery). */
export function resetPdfJsModule() {
  pdfjsModule = null;
}

export async function openPdfDocument(
  source: Uint8Array,
  password?: string,
): Promise<PdfJsDocument> {
  const pdfjs = await setupPdfJs();
  const loadParams: Record<string, unknown> = {
    data: source.slice(),
    password: password?.trim() || undefined,
    ...getPdfJsDocumentAssetParams(),
  };
  try {
    return await pdfjs.getDocument(loadParams).promise;
  } catch (error) {
    // Worker may 404 if assets were not synced — fall back to CDN once.
    const message = error instanceof Error ? error.message : String(error);
    if (/worker|fetch|failed to fetch|dynamically imported|wasm/i.test(message)) {
      const version = pdfjs.version || "5.7.284";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      return pdfjs.getDocument({
        data: source.slice(),
        password: password?.trim() || undefined,
        wasmUrl: `https://unpkg.com/pdfjs-dist@${version}/wasm/`,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
        useSystemFonts: true,
        useWorkerFetch: true,
      }).promise;
    }
    throw error;
  }
}

function textContentHasItems(textContent: unknown): boolean {
  if (!textContent || typeof textContent !== "object") return false;
  const items = (textContent as { items?: unknown }).items;
  return Array.isArray(items) && items.length > 0;
}

/**
 * Render a reader page. Canvas paint is authoritative for scanned / image PDFs;
 * the text layer is optional and never blanks a successful bitmap.
 */
export async function renderPdfReaderPage(options: {
  doc: PdfJsDocument;
  pageNumber: number;
  scale: number;
  canvas: HTMLCanvasElement;
  textLayerEl: HTMLElement | null;
}): Promise<{ width: number; height: number }> {
  const { doc, pageNumber, scale, canvas, textLayerEl } = options;
  const pdfjs = await setupPdfJs();
  const page = await doc.getPage(pageNumber);

  const painted = await paintPdfPageToCanvas({
    page: page as never,
    canvas,
    scale,
    background: "opaque-white",
  });

  // If soft errors left a blank canvas, surface a hard failure for the UI retry path.
  if (painted.softError && !canvasHasVisibleInk(canvas)) {
    if (isPdfRenderCancelled(painted.softError)) throw painted.softError;
    throw painted.softError;
  }

  // Text selection is best-effort. Scanned PDFs often have zero text items —
  // skip TextLayer entirely so an empty layer never covers the bitmap.
  if (textLayerEl) {
    textLayerEl.replaceChildren();
    textLayerEl.style.width = `${painted.width}px`;
    textLayerEl.style.height = `${painted.height}px`;
    textLayerEl.setAttribute("data-empty", "true");

    try {
      const textContent = await page.getTextContent();
      if (textContentHasItems(textContent)) {
        textLayerEl.removeAttribute("data-empty");
        const layer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerEl,
          viewport: page.getViewport({ scale }),
        });
        await layer.render();
      }
    } catch (error) {
      // Font / operator issues in text extraction must not hide the canvas.
      if (!isPdfSoftRenderError(error) && !isPdfRenderCancelled(error)) {
        console.warn("[pdf-reader] text layer skipped:", error);
      }
      textLayerEl.replaceChildren();
      textLayerEl.setAttribute("data-empty", "true");
    }
  }

  return { width: painted.width, height: painted.height };
}
