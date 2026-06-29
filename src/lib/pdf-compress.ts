import { PDFDocument } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "@/lib/pdf-errors";
import {
  PDF_COMPRESSION_PRESETS,
  type PdfCompressionPreset,
} from "@/lib/pdf-compress-presets";

export type CompressPdfProgress = {
  currentPage: number;
  totalPages: number;
};

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode compressed page."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

/** Client-side PDF compression — rasterize pages locally and rebuild with JPEG streams. */
export async function compressPdfBytes(
  source: Uint8Array,
  preset: PdfCompressionPreset,
  options?: { onProgress?: (progress: CompressPdfProgress) => void },
): Promise<{ bytes: Uint8Array; originalBytes: number; outputBytes: number }> {
  const originalBytes = source.byteLength;
  const { jpegQuality, renderScale } = PDF_COMPRESSION_PRESETS[preset];

  let sourceDoc: PDFDocument;
  try {
    sourceDoc = await PDFDocument.load(source);
  } catch (error) {
    throw classifyPdfError(error);
  }

  if (sourceDoc.isEncrypted) {
    throw new Error("This PDF is password-protected. Unlock it before compressing.");
  }

  const pdfjs = await setupPdfJs();
  let pdfJsDoc: Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>;
  try {
    pdfJsDoc = await pdfjs.getDocument({ data: source.slice() }).promise;
  } catch (error) {
    throw classifyPdfError(error);
  }

  const totalPages = sourceDoc.getPageCount();
  const outDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i += 1) {
    const { width, height } = sourceDoc.getPage(i).getSize();
    const page = await pdfJsDoc.getPage(i + 1);
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");
    await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;

    const jpegBytes = await canvasToJpeg(canvas, jpegQuality);
    const image = await outDoc.embedJpg(jpegBytes);
    const outPage = outDoc.addPage([width, height]);
    outPage.drawImage(image, { x: 0, y: 0, width, height });

    options?.onProgress?.({ currentPage: i + 1, totalPages });
  }

  const bytes = await outDoc.save({ useObjectStreams: true });
  return { bytes, originalBytes, outputBytes: bytes.byteLength };
}

export async function compressPdfFile(
  file: File,
  preset: PdfCompressionPreset,
  options?: { onProgress?: (progress: CompressPdfProgress) => void },
) {
  if (!file) throw new Error("No PDF file selected.");
  const source = new Uint8Array(await file.arrayBuffer());
  const result = await compressPdfBytes(source, preset, options);
  const sizeRatio = result.originalBytes
    ? result.outputBytes / result.originalBytes
    : 1;
  return {
    bytes: result.bytes,
    originalBytes: result.originalBytes,
    outputBytes: result.outputBytes,
    sizeRatio,
  };
}
