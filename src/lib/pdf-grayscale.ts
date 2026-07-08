import { PDFDocument } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

const RENDER_SCALE = 2;
const JPEG_QUALITY = 0.82;

export type GrayscalePdfProgress = {
  phase: "loading" | "rendering" | "finalizing";
  currentPage: number;
  totalPages: number;
};

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function loadDocument(source: Uint8Array, password?: string): Promise<PDFDocument> {
  const loadOptions = password?.trim() ? { password: password.trim() } : {};
  try {
    return await PDFDocument.load(source, loadOptions);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

function applyGrayscaleFilter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    const value = Math.round(gray);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode grayscale page."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

/** Rasterize each page, convert to grayscale, and rebuild an optimized PDF locally. */
export async function convertPdfToGrayscaleBytes(
  source: Uint8Array,
  options?: { password?: string; onProgress?: (progress: GrayscalePdfProgress) => void },
): Promise<Uint8Array> {
  const password = options?.password?.trim() || undefined;
  const onProgress = options?.onProgress;

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  const sourceDoc = await loadDocument(source, password);
  if (sourceDoc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to convert it to grayscale.");
  }

  const pdfjs = await setupPdfJs();
  const loadData = source.slice();
  let pdfJsDoc: Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>;
  try {
    pdfJsDoc = await pdfjs.getDocument(
      password ? { data: loadData, password } : { data: loadData },
    ).promise;
  } catch (error) {
    throw classifyPdfError(error);
  }

  const totalPages = sourceDoc.getPageCount();
  const outDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i += 1) {
    onProgress?.({ phase: "rendering", currentPage: i + 1, totalPages });

    const { width, height } = sourceDoc.getPage(i).getSize();
    const page = await pdfJsDoc.getPage(i + 1);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser.");

    await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    applyGrayscaleFilter(ctx, canvas.width, canvas.height);

    const jpegBytes = await canvasToJpeg(canvas, JPEG_QUALITY);
    const image = await outDoc.embedJpg(jpegBytes);
    const outPage = outDoc.addPage([width, height]);
    outPage.drawImage(image, { x: 0, y: 0, width, height });
  }

  const title = sourceDoc.getTitle();
  if (title) outDoc.setTitle(`${title} (Grayscale)`);
  outDoc.setProducer("JoinMyPDF Grayscale PDF Converter");
  outDoc.setCreator("JoinMyPDF Grayscale PDF Converter");
  outDoc.setModificationDate(new Date());

  onProgress?.({ phase: "finalizing", currentPage: totalPages, totalPages });

  return outDoc.save({ useObjectStreams: true });
}

export async function convertPdfToGrayscaleFromFile(
  file: File,
  options?: { password?: string; onProgress?: (progress: GrayscalePdfProgress) => void },
): Promise<Uint8Array> {
  const source = new Uint8Array(await file.arrayBuffer());
  return convertPdfToGrayscaleBytes(source, options);
}

export function grayscalePdfOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-grayscale.pdf`;
}
