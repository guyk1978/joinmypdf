import { PDFDocument } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

/** Crop region in normalized coordinates (0–1, origin top-left). */
export type NormalizedCropRect = {
  nx: number;
  ny: number;
  nw: number;
  nh: number;
};

export const DEFAULT_CROP_RECT: NormalizedCropRect = {
  nx: 0.08,
  ny: 0.08,
  nw: 0.84,
  nh: 0.84,
};

const MIN_CROP_FRACTION = 0.05;

export function clampCropRect(rect: NormalizedCropRect): NormalizedCropRect {
  const nw = Math.max(MIN_CROP_FRACTION, Math.min(1, rect.nw));
  const nh = Math.max(MIN_CROP_FRACTION, Math.min(1, rect.nh));
  const nx = Math.max(0, Math.min(1 - nw, rect.nx));
  const ny = Math.max(0, Math.min(1 - nh, rect.ny));
  return { nx, ny, nw, nh };
}

/** Map UI top-left normalized rect to PDF bottom-left crop box. */
export function normalizedToPdfCropBox(
  pageWidth: number,
  pageHeight: number,
  rect: NormalizedCropRect,
) {
  const safe = clampCropRect(rect);
  const width = Math.max(1, safe.nw * pageWidth);
  const height = Math.max(1, safe.nh * pageHeight);
  const x = safe.nx * pageWidth;
  const y = pageHeight - (safe.ny + safe.nh) * pageHeight;
  return { x, y, width, height };
}

export async function cropPdfBytes(
  file: File,
  crop: NormalizedCropRect,
): Promise<Uint8Array> {
  if (!file) throw new Error("Choose a PDF file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error("That file is empty.");

  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    if (!pageCount) throw new Error("This PDF has no pages.");

    const rect = clampCropRect(crop);

    for (let i = 0; i < pageCount; i += 1) {
      const page = doc.getPage(i);
      const { width, height } = page.getSize();
      const box = normalizedToPdfCropBox(width, height, rect);
      page.setCropBox(box.x, box.y, box.width, box.height);
      page.setMediaBox(box.x, box.y, box.width, box.height);
    }

    return doc.save({ useObjectStreams: false });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function cropPdfOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-cropped.pdf`;
}
