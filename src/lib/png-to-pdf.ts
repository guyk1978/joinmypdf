import { PDFDocument } from "pdf-lib-with-encrypt";
import { normalizePngBytes } from "./png-normalize";

function isPngFile(file: File) {
  return /png$/i.test(file.type) || /\.png$/i.test(file.name);
}

/** Convert one or more PNG images into a single PDF (one page per image). */
export async function pngToPdfBytes(files: File[]): Promise<Uint8Array> {
  const valid = (files || []).filter(Boolean);
  if (!valid.length) throw new Error("Add at least one PNG image.");

  const doc = await PDFDocument.create();

  for (const file of valid) {
    if (!isPngFile(file)) {
      throw new Error(`"${file.name}" is not a PNG file.`);
    }
    const pngBytes = await normalizePngBytes(file);
    const pngImage = await doc.embedPng(pngBytes);
    const page = doc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height,
    });
  }

  return doc.save({ useObjectStreams: false });
}
