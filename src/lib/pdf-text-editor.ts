import { PDFDocument, StandardFonts, rgb } from "pdf-lib-with-encrypt";
import { hexToPdfRgb } from "./add-page-numbers";

export type PdfTextLayer = {
  pageIndex: number;
  /** Normalized X from left (0–1). */
  nx: number;
  /** Normalized Y from top (0–1). */
  ny: number;
  text: string;
  fontSize: number;
  colorHex: string;
  /** Draw a white cover rectangle before text to mask underlying content. */
  coverExisting: boolean;
};

export function pdfTextEditorOutputName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  return `${base}-edited.pdf`;
}

function estimateTextWidth(text: string, fontSize: number): number {
  return Math.max(text.length, 1) * fontSize * 0.52;
}

export async function applyPdfTextLayers(
  source: Uint8Array,
  layers: PdfTextLayer[],
  options?: { password?: string },
): Promise<Uint8Array> {
  if (!layers.length) throw new Error("Add at least one text layer.");

  const password = options?.password?.trim() || undefined;
  const loadOptions = password ? { password } : {};
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(source, loadOptions);
  } catch {
    doc = await PDFDocument.load(source, { ignoreEncryption: true });
  }

  if (doc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to edit it.");
  }

  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const layer of layers) {
    const text = layer.text.trim();
    if (!text) continue;
    if (layer.pageIndex < 0 || layer.pageIndex >= doc.getPageCount()) continue;

    const page = doc.getPage(layer.pageIndex);
    const { width, height } = page.getSize();
    const fontSize = Math.max(6, Math.min(layer.fontSize, 96));
    const textWidth = estimateTextWidth(text, fontSize);
    const x = Math.max(0, Math.min(layer.nx * width, width - textWidth));
    const pdfY = height - layer.ny * height - fontSize;
    const y = Math.max(0, Math.min(pdfY, height - fontSize));
    const color = hexToPdfRgb(layer.colorHex);

    if (layer.coverExisting) {
      const pad = 4;
      page.drawRectangle({
        x: x - pad,
        y: y - pad,
        width: textWidth + pad * 2,
        height: fontSize + pad * 2,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      });
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });
  }

  return doc.save({ useObjectStreams: false });
}
