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
  if (doc.isEncrypted) {
    throw new Error("This PDF is password-protected. Unlock it before rearranging pages.");
  }
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

/**
 * Compact 0-based page indices into a range spec like "1, 3-5, 8".
 * Duplicates are removed; order is ascending by page number.
 */
export function formatPageRangeSpec(indices: number[]): string {
  const sorted = [...new Set(indices)]
    .filter((index) => Number.isInteger(index) && index >= 0)
    .sort((a, b) => a - b);
  if (!sorted.length) return "";

  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = sorted[0]!;

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    parts.push(start === prev ? String(start + 1) : `${start + 1}-${prev + 1}`);
    start = prev = current;
  }
  parts.push(start === prev ? String(start + 1) : `${start + 1}-${prev + 1}`);
  return parts.join(", ");
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

/** Inclusive 0-based page range for a split segment. */
export type PdfSplitSegment = { start: number; end: number };

/** Derive split segments from “break after page index” markers. */
export function segmentsFromBreaksAfter(
  pageCount: number,
  breaksAfter: Iterable<number>,
): PdfSplitSegment[] {
  if (pageCount <= 0) return [];
  const breakSet = new Set(
    [...breaksAfter].filter((index) => index >= 0 && index < pageCount - 1),
  );
  const segments: PdfSplitSegment[] = [];
  let start = 0;
  for (let i = 0; i < pageCount - 1; i += 1) {
    if (breakSet.has(i)) {
      segments.push({ start, end: i });
      start = i + 1;
    }
  }
  segments.push({ start, end: pageCount - 1 });
  return segments;
}

export function breaksAfterFromSegments(segments: PdfSplitSegment[]): number[] {
  const breaks: number[] = [];
  for (let i = 0; i < segments.length - 1; i += 1) {
    breaks.push(segments[i]!.end);
  }
  return breaks;
}

export function formatSplitSegmentsSpec(segments: PdfSplitSegment[]): string {
  return segments
    .map((segment) =>
      segment.start === segment.end
        ? String(segment.start + 1)
        : `${segment.start + 1}-${segment.end + 1}`,
    )
    .join(", ");
}

/**
 * Parse a full-document partition like "1-3, 4-7, 8".
 * Ranges must cover pages 1..pageCount with no gaps or overlaps.
 */
export function parseSplitPartitionSpec(spec: string, pageCount: number): PdfSplitSegment[] {
  const trimmed = spec.trim();
  if (!trimmed) {
    throw new Error("Enter at least one page range (e.g. 1-3, 4-8).");
  }
  if (pageCount <= 0) {
    throw new Error("No pages to split.");
  }

  const segments: PdfSplitSegment[] = [];
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
      if (start < 1 || end > pageCount) {
        throw new Error(`Page range ${start}–${end} is out of range (1–${pageCount}).`);
      }
      segments.push({ start: start - 1, end: end - 1 });
    } else {
      const page = Number.parseInt(segment, 10);
      if (!Number.isFinite(page) || page < 1 || page > pageCount) {
        throw new Error(`Invalid page "${segment}". Use numbers between 1 and ${pageCount}.`);
      }
      segments.push({ start: page - 1, end: page - 1 });
    }
  }

  if (!segments.length) {
    throw new Error("Enter at least one page range (e.g. 1-3, 4-8).");
  }

  segments.sort((a, b) => a.start - b.start);

  if (segments[0]!.start !== 0) {
    throw new Error("Ranges must start at page 1.");
  }

  for (let i = 0; i < segments.length; i += 1) {
    const current = segments[i]!;
    if (current.start > current.end) {
      throw new Error("Each range must have a start less than or equal to its end.");
    }
    if (i > 0) {
      const prev = segments[i - 1]!;
      if (current.start !== prev.end + 1) {
        throw new Error(
          `Ranges must be contiguous with no gaps or overlaps (expected page ${prev.end + 2} next).`,
        );
      }
    }
  }

  if (segments[segments.length - 1]!.end !== pageCount - 1) {
    throw new Error(`Ranges must cover every page through ${pageCount}.`);
  }

  return segments;
}

export function splitPdfZipName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  return `${base}-split.zip`;
}

export function splitPdfPartName(fileName: string, part: number, startPage: number, endPage: number): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  const pages = startPage === endPage ? `p${startPage}` : `p${startPage}-${endPage}`;
  return `${base}-part-${part}-${pages}.pdf`;
}
