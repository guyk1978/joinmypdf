import { PDFDocument } from "pdf-lib-with-encrypt";

/** Build a PDF by copying pages from source in the given order (0-based source indices). */
export async function buildPdfFromOrderedPageIndices(
  source: Uint8Array,
  orderedPageIndices: number[],
): Promise<Uint8Array> {
  if (!orderedPageIndices.length) {
    throw new Error("Keep at least one page in the document.");
  }

  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const unique = orderedPageIndices.filter((i, idx, arr) => arr.indexOf(i) === idx);

  for (const index of unique) {
    if (index < 0 || index >= total) {
      throw new Error("Invalid page order.");
    }
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(doc, unique);
  copied.forEach((page) => out.addPage(page));
  return out.save({ useObjectStreams: false });
}
