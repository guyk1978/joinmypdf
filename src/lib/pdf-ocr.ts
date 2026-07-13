import type {
  PdfOcrWorkerRequest,
  PdfOcrWorkerResponse,
} from "@/workers/pdf-ocr.worker";

export type OcrPageResult = { pageIndex: number; text: string };

export type OcrProgress = {
  percent: number;
  pageIndex: number;
  status: string;
};

const OCR_RENDER_SCALE = 2;
/** Soft hint for UI only — OCR is on-demand per page, not bulk. */
const MAX_OCR_PAGES = 100;

/** Always load Hebrew + English so scanned HE/EN pages work on either UI locale. */
export const PDF_EDITOR_OCR_LANGUAGES = "heb+eng";

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode page image for OCR."));
          return;
        }
        resolve(blob);
      },
      "image/png",
      0.92,
    );
  });
}

/** Copy PDF bytes so pdf.js cannot detach the caller's buffer. */
function copyPdfBytes(source: Uint8Array): Uint8Array {
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

/** Grayscale + contrast boost — improves OCR on scanned / low-contrast pages. */
export function preprocessCanvasForOcr(source: HTMLCanvasElement, contrast = 1.4): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.drawImage(source, 0, 0);

  const image = ctx.getImageData(0, 0, out.width, out.height);
  const data = image.data;
  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    const value = Math.max(0, Math.min(255, gray * contrast + intercept));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(image, 0, 0);
  return out;
}

export async function renderPdfPageForOcr(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
): Promise<Blob> {
  const pdfjs = await setupPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: copyPdfBytes(source),
    password: password?.trim() || undefined,
  });
  const doc = await loadingTask.promise;
  if (pageIndex < 0 || pageIndex >= doc.numPages) {
    throw new Error(`Page ${pageIndex + 1} is out of range.`);
  }

  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;

  const prepared = preprocessCanvasForOcr(canvas);
  return canvasToPngBlob(prepared);
}

export function getOcrLangPath(): string {
  const paths = getTesseractAssetPaths();
  return paths.langPath;
}

/**
 * Same-origin Tesseract assets under /assets/tesseract (and /tesseract mirror).
 * Always build absolute URLs from window.location.origin so nested Workers
 * resolve correctly on any deployment host (not relative to a blob: worker URL).
 */
export function getTesseractAssetPaths(): {
  workerPath: string;
  corePath: string;
  langPath: string;
} {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";

  // Prefer /assets/tesseract (same tree as fonts/tessdata). /tesseract is a deploy mirror.
  const base = origin
    ? new URL("/assets/tesseract/", origin).href.replace(/\/$/, "")
    : "/assets/tesseract";

  return {
    workerPath: `${base}/worker.min.js`,
    // Directory of core builds (SIMD/LSTM). Also deploy tesseract-core.wasm.js here.
    corePath: base,
    langPath: `${base}/lang-data`,
  };
}

/** @deprecated Prefer PDF_EDITOR_OCR_LANGUAGES — always includes Hebrew. */
export function ocrLanguagesForLocale(_locale?: string): string {
  return PDF_EDITOR_OCR_LANGUAGES;
}

/**
 * OCR a single page image in a Web Worker.
 * Uses Blob structured clone (no ArrayBuffer transfer) to avoid detached-buffer crashes.
 */
export function runSinglePageOcrInWorker(
  pageIndex: number,
  blob: Blob,
  languages: string = PDF_EDITOR_OCR_LANGUAGES,
  handlers: {
    onProgress: (progress: OcrProgress) => void;
    onComplete: (result: OcrPageResult) => void;
    onError: (pageIndex: number, message: string) => void;
  },
): { cancel: () => void } {
  const paths = getTesseractAssetPaths();
  console.log("[PDF-OCR] starting page worker with paths", paths);

  let worker: Worker;
  try {
    worker = new Worker(new URL("../workers/pdf-ocr.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch (error) {
    console.error("[PDF-OCR] Failed to construct OCR Worker (full error):", error);
    handlers.onError(
      pageIndex,
      error instanceof Error ? error.message : "Failed to construct OCR Worker.",
    );
    return { cancel: () => undefined };
  }

  const payload: PdfOcrWorkerRequest = {
    type: "ocr-page",
    pageIndex,
    blob,
    languages: languages || PDF_EDITOR_OCR_LANGUAGES,
    langPath: paths.langPath,
    workerPath: paths.workerPath,
    corePath: paths.corePath,
    gzip: true,
  };

  worker.onmessage = (event: MessageEvent<PdfOcrWorkerResponse>) => {
    const data = event.data;
    if (data.type === "progress") {
      handlers.onProgress({
        percent: data.percent,
        pageIndex: data.pageIndex,
        status: data.status,
      });
      return;
    }
    if (data.type === "ok") {
      worker.terminate();
      handlers.onComplete({ pageIndex: data.pageIndex, text: data.text });
      return;
    }
    if (data.type === "error") {
      console.error("[PDF-OCR] worker reported error:", data);
      worker.terminate();
      handlers.onError(data.pageIndex, data.message);
    }
  };

  worker.onerror = (error) => {
    console.error("[PDF-OCR] worker.onerror (full error):", error);
    console.error("[PDF-OCR] worker.onerror detail:", {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      error: error.error,
    });
    worker.terminate();
    handlers.onError(pageIndex, error.message || "OCR worker failed.");
  };

  worker.onmessageerror = (error) => {
    console.error("[PDF-OCR] worker.onmessageerror (full error):", error);
  };

  try {
    worker.postMessage(payload);
  } catch (error) {
    console.error("[PDF-OCR] postMessage failed (full error):", error);
    worker.terminate();
    handlers.onError(
      pageIndex,
      error instanceof Error ? error.message : "Failed to start OCR worker.",
    );
  }

  return {
    cancel: () => {
      worker.terminate();
    },
  };
}

export function ocrTextToHtml(text: string): string {
  const lines = text
    .replace(/\u000c/g, "\n")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim());

  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${escapeHtml(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listItems = [];
      listType = null;
      return;
    }
    const tag = listType;
    blocks.push(
      `<${tag}>${listItems.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join("")}</${tag}>`,
    );
    listItems = [];
    listType = null;
  };

  for (const line of lines) {
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    const bullet = line.match(/^([•\-\*▪︎])\s+(.*)$/);
    const ordered = line.match(/^(\d+)[.)]\s+(.*)$/);

    if (bullet) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(bullet[2] || "");
      continue;
    }
    if (ordered) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(ordered[2] || "");
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushList();
  flushParagraph();
  return blocks.join("") || "<p></p>";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { MAX_OCR_PAGES };
