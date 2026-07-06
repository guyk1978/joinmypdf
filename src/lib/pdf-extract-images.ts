import { classifyPdfError } from "./pdf-errors";

type ObjectStore = {
  get: (name: string, cb?: (obj: unknown) => void) => unknown;
};

type PdfJsPageProxy = {
  objs: ObjectStore;
  commonObjs: ObjectStore;
  getOperatorList: () => Promise<{
    fnArray: number[];
    argsArray: unknown[][];
  }>;
};

type PdfJsDocProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
};

type ExtractableImage =
  | { bitmap: ImageBitmap; width?: number; height?: number }
  | { data: Uint8ClampedArray | Uint8Array; width: number; height: number }
  | CanvasImageSource;

export type ExtractedPdfImage = {
  page: number;
  index: number;
  name: string;
  blob: Blob;
};

const IMAGE_RESOLVE_TIMEOUT_MS = 12_000;

function sanitizePart(value: string): string {
  return value.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

function fileBase(file: File): string {
  return sanitizePart(file.name.replace(/\.pdf$/i, "") || "document");
}

function imageName(base: string, page: number, index: number): string {
  return `${base}-image-p${page}-${index}.png`;
}

export function extractImagesZipName(file: File): string {
  return `${fileBase(file)}-images.zip`;
}

function isReadyImage(obj: unknown): obj is ExtractableImage {
  if (!obj || typeof obj !== "object") return false;

  if ("bitmap" in obj) {
    const bitmap = (obj as { bitmap?: ImageBitmap }).bitmap;
    return Boolean(bitmap && bitmap.width > 0 && bitmap.height > 0);
  }

  if ("data" in obj && "width" in obj && "height" in obj) {
    const raw = obj as { data: unknown; width: number; height: number };
    return raw.width > 0 && raw.height > 0 && raw.data != null;
  }

  const source = obj as { width?: number; height?: number };
  return Boolean(source.width && source.height);
}

function imageStoreForName(page: PdfJsPageProxy, name: string): ObjectStore {
  // pdf.js stores shared/repeated XObject images in commonObjs (names start with "g_").
  return name.startsWith("g_") ? page.commonObjs : page.objs;
}

function resolveImageObject(page: PdfJsPageProxy, name: string): Promise<ExtractableImage | null> {
  const store = imageStoreForName(page, name);

  return new Promise<ExtractableImage | null>((resolve) => {
    let settled = false;
    const finish = (value: ExtractableImage | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };

    const timer = window.setTimeout(() => finish(null), IMAGE_RESOLVE_TIMEOUT_MS);

    try {
      const sync = store.get(name);
      if (isReadyImage(sync)) {
        finish(sync);
        return;
      }
    } catch {
      // Fall through to async callback path.
    }

    try {
      store.get(name, (obj) => {
        finish(isReadyImage(obj) ? obj : null);
      });
    } catch {
      finish(null);
    }
  });
}

function operatorImageName(args: unknown): string {
  if (typeof args === "string") return args;
  if (Array.isArray(args) && typeof args[0] === "string") return args[0];
  return "";
}

function operatorInlineImage(args: unknown): ExtractableImage | null {
  const candidate = Array.isArray(args) ? args[0] : args;
  return isReadyImage(candidate) ? candidate : null;
}

function toRgba(data: Uint8ClampedArray | Uint8Array, width: number, height: number): Uint8ClampedArray {
  const expectedRgb = width * height * 3;
  const expectedRgba = width * height * 4;
  if (data.length === expectedRgba) {
    return data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);
  }
  if (data.length === expectedRgb) {
    const rgba = new Uint8ClampedArray(expectedRgba);
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i]!;
      rgba[j + 1] = data[i + 1]!;
      rgba[j + 2] = data[i + 2]!;
      rgba[j + 3] = 255;
    }
    return rgba;
  }
  const fallback = new Uint8ClampedArray(expectedRgba);
  fallback.fill(255);
  return fallback;
}

async function imageToBlob(image: ExtractableImage): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");

  if (typeof ImageBitmap !== "undefined" && "bitmap" in (image as Record<string, unknown>)) {
    const bitmap = (image as { bitmap?: ImageBitmap }).bitmap;
    if (bitmap) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);
    }
  } else if ("data" in (image as Record<string, unknown>) && "width" in (image as Record<string, unknown>)) {
    const raw = image as { data: Uint8ClampedArray | Uint8Array; width: number; height: number };
    canvas.width = raw.width;
    canvas.height = raw.height;
    const rgba = toRgba(raw.data, raw.width, raw.height);
    const stable = new Uint8ClampedArray(rgba.length);
    stable.set(rgba);
    ctx.putImageData(new ImageData(stable, raw.width, raw.height), 0, 0);
  } else {
    const source = image as CanvasImageSource & { width?: number; height?: number };
    const w = Math.max(1, Math.floor(Number(source.width) || 0));
    const h = Math.max(1, Math.floor(Number(source.height) || 0));
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(source, 0, 0, w, h);
  }

  if (!canvas.width || !canvas.height) return null;
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function loadPdfForImageExtraction(file: File): Promise<PdfJsDocProxy> {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({
    data,
    // Required so embedded image pixel data is exposed to objs.get callbacks (pdf.js #16282).
    isOffscreenCanvasSupported: false,
  }).promise as Promise<PdfJsDocProxy>;
}

export async function extractImagesFromPdf(
  file: File,
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<ExtractedPdfImage[]> {
  const pdfjs = await import("pdfjs-dist");
  const OPS = (pdfjs as unknown as { OPS?: Record<string, number> }).OPS || {};

  const base = fileBase(file);
  try {
    const doc = await loadPdfForImageExtraction(file);
    const totalPages = doc.numPages;
    const out: ExtractedPdfImage[] = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.(pageNumber, totalPages);
      const page = await doc.getPage(pageNumber);
      const opList = await page.getOperatorList();
      const namedRefs: string[] = [];
      const inlineImages: ExtractableImage[] = [];

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];

        if (fn === OPS.paintInlineImageXObject) {
          const inline = operatorInlineImage(args);
          if (inline) inlineImages.push(inline);
          continue;
        }

        if (
          fn === OPS.paintImageXObject ||
          fn === OPS.paintImageXObjectRepeat ||
          fn === OPS.paintJpegXObject
        ) {
          const name = operatorImageName(args);
          if (name) namedRefs.push(name);
        }
      }

      let pageIndex = 0;
      const uniqueNames = Array.from(new Set(namedRefs));

      for (const name of uniqueNames) {
        const obj = await resolveImageObject(page, name);
        if (!obj) continue;
        const blob = await imageToBlob(obj);
        if (!blob) continue;
        pageIndex += 1;
        out.push({
          page: pageNumber,
          index: pageIndex,
          name: imageName(base, pageNumber, pageIndex),
          blob,
        });
      }

      for (const inline of inlineImages) {
        const blob = await imageToBlob(inline);
        if (!blob) continue;
        pageIndex += 1;
        out.push({
          page: pageNumber,
          index: pageIndex,
          name: imageName(base, pageNumber, pageIndex),
          blob,
        });
      }
    }

    return out;
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export async function loadExtractImagesPdfPageCount(file: File): Promise<number> {
  const doc = await loadPdfForImageExtraction(file);
  return doc.numPages;
}
