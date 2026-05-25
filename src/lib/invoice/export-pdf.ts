import { PDFDocument } from "pdf-lib-with-encrypt";
import type { InvoiceDocument } from "./types";
import { buildExportPayload } from "./calculations";

/** ISO A4 size in PDF points (72 dpi). */
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to capture invoice preview."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
      },
      "image/png",
      1,
    );
  });
}

function invoiceFileName(document: InvoiceDocument): string {
  const num = document.invoiceNumber.trim().replace(/[^\w-]+/g, "-") || "invoice";
  return `joinmypdf-${num}.pdf`;
}

/**
 * Rasterize the live A4 preview (#invoice-print-root) and embed it in a new PDF via pdf-lib
 * (same stack as merge / sign / redact tools).
 */
export async function exportInvoiceElementToPdf(
  element: HTMLElement,
  document: InvoiceDocument,
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");

  const payload = buildExportPayload(document);
  console.info("[InvoiceGenerator] export payload", payload);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDoc) => {
      const node = clonedDoc.getElementById(element.id);
      if (node instanceof HTMLElement) {
        node.style.boxShadow = "none";
        node.style.margin = "0";
      }
    },
  });

  const pngBytes = await canvasToPngBytes(canvas);
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(pngBytes);

  const imgW = image.width;
  const imgH = image.height;
  const scale = Math.min(A4_WIDTH_PT / imgW, A4_HEIGHT_PT / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
  page.drawImage(image, {
    x: (A4_WIDTH_PT - drawW) / 2,
    y: (A4_HEIGHT_PT - drawH) / 2,
    width: drawW,
    height: drawH,
  });

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), invoiceFileName(document));
}
