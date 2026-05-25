import { PDFDocument } from "pdf-lib-with-encrypt";
import type { TimelineProject } from "./types";

/** A4 landscape in PDF points (72 dpi). */
const LANDSCAPE_WIDTH_PT = 841.89;
const LANDSCAPE_HEIGHT_PT = 595.28;

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
          reject(new Error("Failed to capture timeline chart."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
      },
      "image/png",
      1,
    );
  });
}

function timelineFileName(project: TimelineProject): string {
  const slug = project.title.trim().replace(/[^\w-]+/g, "-").toLowerCase() || "timeline";
  return `joinmypdf-${slug}-gantt.pdf`;
}

/**
 * Rasterize the live chart (#timeline-print-root) and embed in a landscape PDF via pdf-lib.
 */
export async function exportTimelineElementToPdf(
  element: HTMLElement,
  project: TimelineProject,
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0f172a",
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
  const scale = Math.min(LANDSCAPE_WIDTH_PT / imgW, LANDSCAPE_HEIGHT_PT / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const page = pdfDoc.addPage([LANDSCAPE_WIDTH_PT, LANDSCAPE_HEIGHT_PT]);
  page.drawImage(image, {
    x: (LANDSCAPE_WIDTH_PT - drawW) / 2,
    y: (LANDSCAPE_HEIGHT_PT - drawH) / 2,
    width: drawW,
    height: drawH,
  });

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  downloadBlob(
    new Blob([bytes as BlobPart], { type: "application/pdf" }),
    timelineFileName(project),
  );
}
