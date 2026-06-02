import { PDFDocument } from "pdf-lib-with-encrypt";

const FLATTEN_SCALE = 2;
const JPEG_QUALITY = 0.92;

export type FlattenPdfProgress = {
  phase: "loading" | "flattening";
  currentPage: number;
  totalPages: number;
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

/** Rasterize every page so forms, annotations, and comments are no longer editable. */
export async function flattenPdfBytes(
  source: Uint8Array,
  options?: { password?: string; onProgress?: (progress: FlattenPdfProgress) => void },
): Promise<Uint8Array> {
  const password = options?.password?.trim() || undefined;
  const onProgress = options?.onProgress;

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  const pdfjs = await setupPdfJs();
  const pdfJsDoc = await pdfjs.getDocument({
    data: source.slice(),
    password,
  }).promise;

  const totalPages = pdfJsDoc.numPages;
  onProgress?.({ phase: "flattening", currentPage: 0, totalPages });

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

  const outDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i += 1) {
    const { width, height } = libDoc.getPage(i).getSize();
    const canvas = await renderPdfJsPage(pdfJsDoc, i + 1, FLATTEN_SCALE);
    const jpegBytes = await canvasToJpeg(canvas);
    const image = await outDoc.embedJpg(jpegBytes);
    const page = outDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    onProgress?.({ phase: "flattening", currentPage: i + 1, totalPages });
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
