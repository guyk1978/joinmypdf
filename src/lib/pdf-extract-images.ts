import { classifyPdfError } from "./pdf-errors";

type PdfJsPageProxy = {
  objs: {
    get: (name: string, cb?: (obj: unknown) => void) => unknown;
  };
  commonObjs: {
    get: (name: string, cb?: (obj: unknown) => void) => unknown;
  };
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

function resolveImageObject(page: PdfJsPageProxy, name: string): Promise<ExtractableImage | null> {
  const getFromStore = (store: PdfJsPageProxy["objs"] | PdfJsPageProxy["commonObjs"]) =>
    new Promise<ExtractableImage | null>((resolve) => {
      try {
        const sync = store.get(name) as ExtractableImage | undefined;
        if (sync) {
          resolve(sync);
          return;
        }
      } catch {
        // Ignore and wait for async callback path.
      }

      try {
        store.get(name, (obj) => resolve((obj as ExtractableImage) || null));
      } catch {
        resolve(null);
      }
    });

  return (async () => {
    const primary = await getFromStore(page.objs);
    if (primary) return primary;
    return getFromStore(page.commonObjs);
  })();
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

export async function extractImagesFromPdf(
  file: File,
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<ExtractedPdfImage[]> {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  const OPS = (pdfjs as unknown as { OPS?: Record<string, number> }).OPS || {};

  const url = URL.createObjectURL(file);
  const base = fileBase(file);
  try {
    const doc = (await pdfjs.getDocument({ url }).promise) as PdfJsDocProxy;
    const totalPages = doc.numPages;
    const out: ExtractedPdfImage[] = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.(pageNumber, totalPages);
      const page = await doc.getPage(pageNumber);
      const opList = await page.getOperatorList();
      const names: string[] = [];

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i] || [];
        if (
          fn === OPS.paintImageXObject ||
          fn === OPS.paintImageXObjectRepeat ||
          fn === OPS.paintJpegXObject
        ) {
          const name = typeof args[0] === "string" ? (args[0] as string) : "";
          if (name) names.push(name);
        }
      }

      const unique = Array.from(new Set(names));
      let pageIndex = 0;
      for (const name of unique) {
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
    }

    return out;
  } catch (error) {
    throw classifyPdfError(error);
  } finally {
    URL.revokeObjectURL(url);
  }
}
