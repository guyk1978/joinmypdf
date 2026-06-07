import { PDFDocument } from "pdf-lib-with-encrypt";

const FLATTEN_SCALE = 2;
const JPEG_QUALITY = 0.92;

const RASTERIZE_ANNOTATION_SUBTYPES = new Set([
  "Widget",
  "Text",
  "FreeText",
  "Highlight",
  "Underline",
  "Squiggly",
  "StrikeOut",
  "Ink",
  "Stamp",
  "Caret",
  "Popup",
  "FileAttachment",
  "Sound",
  "Movie",
  "RichMedia",
  "PolyLine",
  "Polygon",
  "Circle",
  "Square",
  "Line",
  "Redact",
]);

export type FlattenPdfProgress = {
  phase: "loading" | "flattening";
  currentPage: number;
  totalPages: number;
  rasterizedPages?: number;
};

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

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode flattened page."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

async function pageNeedsRasterization(
  pdfJsDoc: Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>,
  pageNumber: number,
): Promise<boolean> {
  const page = await pdfJsDoc.getPage(pageNumber);
  const annotations = await page.getAnnotations();
  return annotations.some((annotation) => {
    const subtype = String((annotation as { subtype?: string }).subtype || "");
    return RASTERIZE_ANNOTATION_SUBTYPES.has(subtype);
  });
}

/** Flatten interactive layers; rasterize only pages that need it so text stays selectable elsewhere. */
export async function flattenPdfBytes(
  source: Uint8Array,
  options?: { password?: string; onProgress?: (progress: FlattenPdfProgress) => void },
): Promise<Uint8Array> {
  const password = options?.password?.trim() || undefined;
  const onProgress = options?.onProgress;

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0, rasterizedPages: 0 });

  const loadOptions = password ? { password } : {};
  let libDoc: PDFDocument;
  try {
    libDoc = await PDFDocument.load(source, loadOptions);
  } catch {
    libDoc = await PDFDocument.load(source, { ignoreEncryption: true });
  }

  if (libDoc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to flatten it.");
  }

  try {
    const form = libDoc.getForm();
    const fields = form.getFields();
    if (fields.length > 0) {
      form.flatten();
    }
  } catch {
    // No AcroForm — continue with annotation detection.
  }

  const flattenedFormBytes = await libDoc.save({ useObjectStreams: false });
  const workingLibDoc = await PDFDocument.load(flattenedFormBytes, loadOptions);

  const pdfjs = await setupPdfJs();
  const pdfJsDoc = await pdfjs.getDocument({
    data: flattenedFormBytes.slice(),
    password,
  }).promise;

  const totalPages = workingLibDoc.getPageCount();
  onProgress?.({ phase: "flattening", currentPage: 0, totalPages, rasterizedPages: 0 });

  const rasterFlags: boolean[] = [];
  for (let i = 0; i < totalPages; i += 1) {
    rasterFlags.push(await pageNeedsRasterization(pdfJsDoc, i + 1));
  }

  const allRaster = rasterFlags.every(Boolean);
  const noneRaster = rasterFlags.every((flag) => !flag);

  if (noneRaster) {
    onProgress?.({ phase: "flattening", currentPage: totalPages, totalPages, rasterizedPages: 0 });
    return flattenedFormBytes;
  }

  if (allRaster) {
    const outDoc = await PDFDocument.create();
    let rasterizedPages = 0;
    for (let i = 0; i < totalPages; i += 1) {
      const { width, height } = workingLibDoc.getPage(i).getSize();
      const canvas = await renderPdfJsPage(pdfJsDoc, i + 1, FLATTEN_SCALE);
      const jpegBytes = await canvasToJpeg(canvas);
      const image = await outDoc.embedJpg(jpegBytes);
      const page = outDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
      rasterizedPages += 1;
      onProgress?.({ phase: "flattening", currentPage: i + 1, totalPages, rasterizedPages });
    }
    return outDoc.save({ useObjectStreams: false });
  }

  const outDoc = await PDFDocument.create();
  let rasterizedPages = 0;

  for (let i = 0; i < totalPages; i += 1) {
    const { width, height } = workingLibDoc.getPage(i).getSize();

    if (rasterFlags[i]) {
      const canvas = await renderPdfJsPage(pdfJsDoc, i + 1, FLATTEN_SCALE);
      const jpegBytes = await canvasToJpeg(canvas);
      const image = await outDoc.embedJpg(jpegBytes);
      const page = outDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
      rasterizedPages += 1;
    } else {
      const [copied] = await outDoc.copyPages(workingLibDoc, [i]);
      outDoc.addPage(copied);
    }

    onProgress?.({ phase: "flattening", currentPage: i + 1, totalPages, rasterizedPages });
  }

  return outDoc.save({ useObjectStreams: false });
}

export async function flattenPdfFromFile(
  file: File,
  options?: { password?: string; onProgress?: (progress: FlattenPdfProgress) => void },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  return flattenPdfBytes(source, options);
}

export function flattenPdfOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-flattened.pdf`;
}
