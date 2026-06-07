import { PDFDocument } from "pdf-lib-with-encrypt";

/** Build a PDF by copying pages from source in the given order (0-based source indices). */
export async function buildPdfFromOrderedPageIndices(
  source: Uint8Array,
  orderedPageIndices: number[],
): Promise<Uint8Array> {
  return buildPdfFromPageSequence(source, orderedPageIndices);
}

/** Copy pages in order; duplicate indices are allowed (e.g. extract page 1 twice). */
export async function buildPdfFromPageSequence(
  source: Uint8Array,
  pageIndices: number[],
): Promise<Uint8Array> {
  if (!pageIndices.length) {
    throw new Error("Select at least one page.");
  }

  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  const total = doc.getPageCount();

  for (const index of pageIndices) {
    if (index < 0 || index >= total) {
      throw new Error(`Page ${index + 1} is out of range (document has ${total} page(s)).`);
    }
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(doc, pageIndices);
  copied.forEach((page) => out.addPage(page));
  return out.save({ useObjectStreams: false });
}

/** Parse a page spec like "1, 3-5, 8" into 0-based indices (in order). */
export function parsePageRangeSpec(spec: string, pageCount: number): number[] {
  const trimmed = spec.trim();
  if (!trimmed) return [];

  const result: number[] = [];
  const parts = trimmed.split(/[,;]+/);

  for (const part of parts) {
    const segment = part.trim();
    if (!segment) continue;

    if (segment.includes("-")) {
      const [rawA, rawB] = segment.split("-").map((s) => s.trim());
      const a = Number.parseInt(rawA, 10);
      const b = Number.parseInt(rawB, 10);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        throw new Error(`Invalid range "${segment}". Use formats like 3-5.`);
      }
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let page = start; page <= end; page += 1) {
        if (page < 1 || page > pageCount) {
          throw new Error(`Page ${page} is out of range (1–${pageCount}).`);
        }
        result.push(page - 1);
      }
    } else {
      const page = Number.parseInt(segment, 10);
      if (!Number.isFinite(page) || page < 1 || page > pageCount) {
        throw new Error(`Invalid page "${segment}". Use numbers between 1 and ${pageCount}.`);
      }
      result.push(page - 1);
    }
  }

  return result;
}

export function reorderPdfOutputName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  return `${base}-reordered.pdf`;
}

export function extractPdfOutputName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  return `${base}-extracted.pdf`;
}
