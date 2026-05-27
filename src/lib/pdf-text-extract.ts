import { classifyPdfError } from "./pdf-errors";

export type TextFragment = {
  str: string;
  x: number;
  y: number;
};

export async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

export function isPdfHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

export async function loadPdfDocument(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfHeader(bytes)) {
    throw new Error("This file does not look like a valid PDF.");
  }
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  if (doc.numPages === 0) {
    throw new Error("This PDF has no pages to convert.");
  }
  return doc;
}

export async function extractPageFragments(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfDocument>>["getPage"]>>,
): Promise<TextFragment[]> {
  const content = await page.getTextContent();
  const fragments: TextFragment[] = [];

  for (const item of content.items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const text = item.str.replace(/\s+/g, " ").trim();
    if (!text) continue;
    fragments.push({
      str: text,
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    });
  }

  return fragments;
}

const LINE_TOLERANCE = 4;
const PARAGRAPH_GAP = 16;
const COLUMN_GAP = 24;

export function fragmentsToParagraphs(fragments: TextFragment[]): string[] {
  if (!fragments.length) return [];

  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { y: number; parts: TextFragment[] }[] = [];

  for (const frag of sorted) {
    const line = lines.find((entry) => Math.abs(entry.y - frag.y) <= LINE_TOLERANCE);
    if (line) {
      line.parts.push(frag);
      line.y = (line.y + frag.y) / 2;
    } else {
      lines.push({ y: frag.y, parts: [frag] });
    }
  }

  const lineRows = lines
    .map((line) => ({
      y: line.y,
      text: line.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter((row) => row.text.length > 0)
    .sort((a, b) => b.y - a.y);

  const paragraphs: string[] = [];
  let buffer = "";
  let prevY: number | null = null;

  for (const row of lineRows) {
    if (prevY !== null && Math.abs(prevY - row.y) > PARAGRAPH_GAP) {
      if (buffer.trim()) paragraphs.push(buffer.trim());
      buffer = row.text;
    } else {
      buffer = buffer ? `${buffer} ${row.text}` : row.text;
    }
    prevY = row.y;
  }

  if (buffer.trim()) paragraphs.push(buffer.trim());
  return paragraphs;
}

export function fragmentsToGrid(fragments: TextFragment[]): string[][] {
  if (!fragments.length) return [];

  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
  const lineGroups: { y: number; parts: TextFragment[] }[] = [];

  for (const frag of sorted) {
    const line = lineGroups.find((entry) => Math.abs(entry.y - frag.y) <= LINE_TOLERANCE);
    if (line) {
      line.parts.push(frag);
      line.y = (line.y + frag.y) / 2;
    } else {
      lineGroups.push({ y: frag.y, parts: [frag] });
    }
  }

  const rows: string[][] = [];

  for (const line of lineGroups.sort((a, b) => b.y - a.y)) {
    const parts = [...line.parts].sort((a, b) => a.x - b.x);
    const cells: string[] = [];
    let bucket = parts[0]?.str ?? "";
    let prevX = parts[0]?.x ?? 0;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.x - prevX > COLUMN_GAP) {
        cells.push(bucket.trim());
        bucket = part.str;
      } else {
        bucket = `${bucket} ${part.str}`.replace(/\s+/g, " ").trim();
      }
      prevX = part.x;
    }
    if (bucket.trim()) cells.push(bucket.trim());
    if (cells.length) rows.push(cells);
  }

  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push("");
    return padded;
  });
}

export function wrapPdfError(error: unknown): never {
  throw classifyPdfError(error);
}
